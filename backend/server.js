const express = require("express")
const http = require("http")
const { Server } = require("socket.io")
const cors = require("cors")

const app = express()
app.use(cors())

const server = http.createServer(app)

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
})

app.get("/", (req, res) => {
    res.send("NullChat backend running")
})

io.on("connection", (socket) => {
    console.log("User connected:", socket.id)

    //Event: client requests to join a specific chat room
    socket.on("join-room", (roomId) => {
        socket.join(roomId)
        console.log(`User ${socket.id} joined room ${roomId}`)
    })

    //Event: client sends a message to a room
    socket.on("send-message", ({ roomId, message }) => {
        console.log(`Message in room ${roomId}: ${message}`)

        //Broadcast the message to all sockets currently in that room;
        io.to(roomId).emit("receive-message", message)
    })

    //Event: client connection closes;
    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id)
    })

})

server.listen(3000, () => {
    console.log("BAckend running on http://localhost:3000")
})