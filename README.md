Am ales sa folosesc o arhitectura hexagonala deoarece aplicatia include call-uri catre 
servicii externe (meteo/city APIs), cache distribuit prin Redis si rate limiting prin
contorul atomic din Redis. Asadar, avem nevoie ca solutia propusa sa delimiteze logica 
dintre componente, sa ofere o scalabilitate si o rezilienta mai buna. 

Arhitectura include urmatoarele componente principale:
- interfaces/ <- punctul de intrare in aplicatie (definirea controllerelor care primesc
                    requesturile HTTP)
- application/ <- logica de business pentru cache cu use-caseurile acestuia
- domain/ : ports/ <- include definirea interfetelor care vor fi implementate in infrastructure
            errors/ <- include partea de tratare custom a erorilor
            entities/ <- definirea DTOs
- infrastructure/ <- include implementarile pentru API-urile externe, caching si rate-limit.                          

Am facut implementarea folosindu-ma de NestJS pentru partea de API si Jest + Supertest
pentru partea de testare, iar toata solutia am integrat-o intr-un container de Docker
pentru a putea fi rulata mai usor. (Am generat monorepo-ul folosindu-ma de NX, iar de
aceea pot sa mai existe anumite fisiere redundante in aplicatie)

Am definit caching de 1 minut pentru un oras, avand cheia "weather:city" definita.
Am implementat un flow prin care numele unui oras era transformat in coordonatele sale
folosind Nomatim API, apoi aceste coordonate folosite pentru a obtine datele meteo
folosind Open-meteo API, iar apoi prin intermediul unui DTO am extras doar datele necesare.
Am implementat rate limiting folosindu-ma de atomic counter-ul oferit de Redis. Prin
intermediul acestuia m-am asigurat ca aceasta limita este definita la nivel de user
si nu la nivel de aplicatie, putand fi astfel scalata in cazul in care aplicatia
ar fi distribuita pe mai multe noduri.
Am definit erori custom ce sunt prinse in cazuri diferite, 429, 500, cu posibilitatea
de a putea adauga altele noi la nevoie.
Am implementat un set de teste pentru a testa caching-ul si rate-limiting-ul. Am propus
urmatoarele cazuri:
  1. Cand un utilizator face mai mult de 5 request-uri, va primi "Limit exceeded" incepand cu al 6-lea.
  2. Cand un utilizator face request pe acelasi oras, doar primul request va trece mai departe de API,
        iar celelalte vor folosi cache-ul din Redis.
  3. Cand un utilizator face 5 request-uri pe orase diferite, toate vor fi un call diferit.
  4. Cand 2 utilizatori fac call pe acelasi oras, doar primul va face un request propriu-zis, iar
        celuilalt ii va fi returnata valoarea din cache daca este valida (<1 min).
  5. Cand 2 utilizatori fac call pe 2 orase diferite, vor fi in total 2 call-uri si nu vor interfera
        intre ele.
  6. Cand 5 utilizatori diferiti fac call in acelasi timp, call-urile nu interfereaza intre ele.

Concurenta a fost tratata cu ajutorul atomicitatii operatiilor din Redis, performanta cu ajutorul
cache-ului (primul request este mereu mai lent, iar urmatoarele aproape instantaneu), scalabilitatea
si rezilienta au fost obtinute prin definirea arhitecturii intr-un mod ce suporta imbunatatiri ulterioare,
tolereaza fail-ul unei parti fara ca celelalte sa fie impactate si trateaza cazurile de eroare individual.                   

Totul se poate rula dintr-un "docker-compose up", ce va porni containerele de Redis, cel de Weather-Proxy,
dar si cel de teste (care se va inchide dupa rulare), iar apoi cele principale vor ramane deschise si se poate
testa manual folosind un 'curl -H "USER_ID: user1" "http://localhost:3000/weather?city=London"'. Testele pot
fi rulate si individual, cu cerinta de a avea containerul de redis pornit, prin "REDIS_HOST=localhost nx test api".