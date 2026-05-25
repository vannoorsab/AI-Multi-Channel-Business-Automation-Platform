/**
 * Sets up Socket.IO event listeners for real-time messaging
 * @param {object} io - The Socket.IO server instance
 */
module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket client connected: ${socket.id}`);

    // Join workspace room for workspace isolation
    socket.on('join_workspace', (workspaceId) => {
      if (workspaceId) {
        socket.join(workspaceId.toString());
        console.log(`Socket ${socket.id} joined workspace room: ${workspaceId}`);
      }
    });

    // Agent/Client typing status indicator
    socket.on('typing', ({ workspaceId, leadId, senderName }) => {
      if (workspaceId && leadId) {
        socket.to(workspaceId.toString()).emit('typing', { leadId, senderName });
      }
    });

    socket.on('stop_typing', ({ workspaceId, leadId }) => {
      if (workspaceId && leadId) {
        socket.to(workspaceId.toString()).emit('stop_typing', { leadId });
      }
    });

    // Leave workspace room
    socket.on('leave_workspace', (workspaceId) => {
      if (workspaceId) {
        socket.leave(workspaceId.toString());
        console.log(`Socket ${socket.id} left workspace room: ${workspaceId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket client disconnected: ${socket.id}`);
    });
  });
};
