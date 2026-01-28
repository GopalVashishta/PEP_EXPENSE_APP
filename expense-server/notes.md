# SERVER.JS is now handling EXPRESS, MONGODB connection initialization + routing to authRoutes & groupRoutes

## SRC

### MiddleWare :intercet every request to the server, it will use request(json) to js object, execute the required func.
### CONTROLLERS are the ENTRY point of the system, it calls functionalities of DAO file.
### ROUTER are used to set/define the routes of our web app
### DAO called by the controllers to handle data(CRUD) , i.e. direct communication with DB [Functionalitites visible from the frontEnd]
### MODEL : user(collection) schema definition etc.

#### API(link/UI) -> server.js -> authRoutes-> authController <-> userDao <-> user.js
####                                               ^ return JW-token via cookies @login
#### API(link/UI) -> server.js -> (authMiddleWare)-> groupRoutes -> groupController <-> groupDao <-> group.js
####                                 ^ JWT authentication

## HTTP CODES : 1xx(info exchange), 2xx(success), 4xx(user error), 5xx(server error)

## Json Web Token (jwt (token) has 3 individually encrypted components)
### 1. Secret : random string(kinda encryption key)
### 2. Data/Payload : Infomation to be transferred
### 3. Signature/Expiry : session duration time..