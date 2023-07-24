import express from "express";
import { Server } from "socket.io";
import http from "http";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";

const app = express();
app.use(cors());
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "https://main--bright-macaron-9e9881.netlify.app",
    methods: ["GET", "POST"],
  },
});

let activeUsers = [];
io.on("connection", (socket) => {
  socket.on("new_user_add", (usr) => {
    if (!activeUsers.some((user) => user.userId === usr.userId)) {
      activeUsers.push({ ...usr, socketId: socket.id });
      //   console.log("New User Connected", activeUsers);
    } else {
      const idx = activeUsers.findIndex((u) => u.userId === usr.userId);
      activeUsers[idx] = { ...activeUsers[idx], socketId: socket.id };
    }

    const user = { ...usr, socketId: socket.id };
    io.emit("get-users", { activeUsers, connectedUser: { ...user } });
  });

  //! Send message to all the online users about group
  socket.on("join_group_multiple", (data) => {
    const users = data.users;
    const roomId = uuidv4();
    const socketIds = users.map(
      (user) => activeUsers.find((usr) => usr.userId === user.userId).socketId
    );
    socketIds.forEach((socketId) => {});
  });
  //! for every user - on groupChat click join the room using groupId
  socket.on("join_group", (data) => {
    const group = data.activeGroup;
    socket.join(group.groupId);
    // console.log("Group Joined", data);
  });
  //? socket code for group chat
  socket.on("send_group_message", (data) => {
    // console.log("Group Message Send", data);
    socket.to(data.groupId).emit("receive_group_message", data);
    //! write socket code for emitting receive group chat to frontend
  });

  socket.on("send_groupchat_notification",(data)=>{
    const groupMembers = data.groupMembers;
    // console.log("Group Notification Send", data);
    const onlineUsers = activeUsers.filter(user=>{
      if(groupMembers?.some(member=>member.userId===user.userId)){
        return user;
      }
    })
    console.log(onlineUsers)
    onlineUsers.forEach(user=>{
      socket.to(user.socketId).emit("receive_groupchat_notification",data)
    });
    
  })

  socket.on("send_message", (data) => {
    const { userId } = data;
    const user = activeUsers.find((user) => user.userId === userId);

    if (user) {
      io.to(user.socketId).emit("recieve_message", data);
    }
  });

  socket.on("group_add",(groupInfo)=>{
    console.log("Group added", groupInfo)
    const groupMembers = groupInfo.groupMembers;
    const onlineUsers = activeUsers.filter(user=>{
      if(groupMembers?.some(member=>member.userId===user.userId)){
        return user;
      }
    })
    onlineUsers.forEach(user=>{
      socket.to(user.socketId).emit("group_add_notification",groupInfo)
    });
    //socket.emit("receive_group_add_notification",)
  })

  socket.on("disconnect", () => {
    const disconnectedUser = activeUsers.find(
      (user) => user.socketId === socket.id
    );
    activeUsers = activeUsers.filter((user) => user.socketId !== socket.id);

    console.log("User Disconnected", disconnectedUser);
    // send all active users to all users
    const data = { activeUsers, disconnectedUser };
    io.emit("get-users", data);
  });
});
const PORT = process.env.PORT || 4000
server.listen(PORT, () => {
  console.log("Server running at port " + PORT);
});
