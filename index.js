import express from 'express'
import {Server} from 'socket.io'
import http from 'http'
import cors from 'cors'

const app = express();
app.use(cors())
const server = http.createServer(app)


const io = new Server(server,{
    cors:{
        origin:"http://localhost:3000",
        methods:["GET","POST"]
    }
})

let activeUsers = []
io.on("connection",(socket)=>{
     
     socket.on("new_user_add",(usr)=>{
       
        if (!activeUsers.some((user) => user.userId === usr.userId)) {
            activeUsers.push({ ...usr, socketId: socket.id });
         //   console.log("New User Connected", activeUsers);
          }
          else{
            const idx = activeUsers.findIndex(u=>u.userId===usr.userId);
            activeUsers[idx] = {...activeUsers[idx],socketId:socket.id};
            
          }
          
          const user = {...usr,socketId:socket.id}
          io.emit("get-users", {activeUsers,connectedUser:{...user}});
          
     })

    socket.on("send_message",(data)=>{
           
        const { userId } = data;
        const user = activeUsers.find((user) => user.userId === userId);
        console.log(data)
        if (user) {
          io.to(user.socketId).emit("recieve_message", data);
          
        }

    })
    
//    socket.on("onDisconnect")
    
    socket.on("disconnect",()=>{
        const disconnectedUser= activeUsers.find((user) => user.socketId === socket.id);
        activeUsers = activeUsers.filter((user) => user.socketId !== socket.id);
        
        console.log("User Disconnected", disconnectedUser);
    // send all active users to all users
    const data = {activeUsers,disconnectedUser}
        io.emit("get-users", data);
     })
    
})

server.listen(4000,()=>{
    console.log('Server running at port '+4000)

})

