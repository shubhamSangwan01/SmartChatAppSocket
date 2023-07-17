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

const activeUsers = []
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
          // send all active users to new user
          io.emit("get-users", activeUsers);
          
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
        console.log("User disconnected: "+socket.id)
     })
    
})

server.listen(4000,()=>{
    console.log('Server running at port '+4000)

})

