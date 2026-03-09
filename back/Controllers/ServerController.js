import {
    getAllServerService,
    getServerByIdService,
    createServerService,
    getServerByInviteCodeService,
    addUserToServerService,
    getAllMembersByServerService,
    deleteUserFromServerService,
    createChannelByServerIdService,
    getAllChannelByServerIdService,
    getChannelByIdService,
    deleteServerByIdService,
    deleteChannelByIdService,
    getAllUsersByServerService,
    banUserFromServerService, 
    checkUserBanService       
} from "../Models/ServerModel.js";
import { randomBytes } from 'node:crypto';

const handleResponse = (res, status, message, data = null) => {
    res.status(status).json({ status, message, data });
};

export const getAllServer = async (req, res, next) => {
    try {
        const allServers = await getAllServerService();
        handleResponse(res, 200, "Servers fetched successfully", allServers)
    } catch (error) { next(error); }
};

export const joinServerWithInviteCode = async (req, res, next) => {
  try {
    const { inviteCode } = req.body;
    const userId = req.user?.id;

    const server = await getServerByInviteCodeService(inviteCode);
    if (!server) return handleResponse(res, 404, "Server not found");

    
    const activeBan = await checkUserBanService(server.id, userId);
    if (activeBan) return handleResponse(res, 403, "Tu es banni de ce serveur.");

    await addUserToServerService(userId, server.id);
    handleResponse(res, 200, "User added to server successfully", { serverId: server.id });
  } catch (error) { next(error); }
};

export const getAllMembersByServer = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return handleResponse(res, 401, "Unauthorized");
    const servers = await getAllMembersByServerService(userId);
    handleResponse(res, 200, "Servers fetched successfully", servers);
  } catch (error) { next(error); }
};

export const getServerInviteCode = async (req, res, next) => {
  try {
    const { id } = req.params;
    const server = await getServerByIdService(id);
    if (!server) return handleResponse(res, 404, "Server not found");
    handleResponse(res, 200, "Invite code fetched successfully", { inviteCode: server.invitecode });
  } catch (error) { next(error); }
};

export const getServer = async (req, res, next) => {
    try {
        const Server = await getServerByIdService(req.params.id);
        if(!Server) return handleResponse(res, 404, "Server not found")
        handleResponse(res, 200, "Server fetched successfully", Server)
    } catch (error) { next(error); }
};

export const getAllChannelByServerId = async (req, res, next) => {
  try {
    const { serverId } = req.params;
    const AllChannel = await getAllChannelByServerIdService(serverId);
    if(!AllChannel) return handleResponse(res, 404, "Cannot get all channels");
    handleResponse(res, 200, "Get all channels successfully", AllChannel);
  } catch (error) { next(error); }
};

export const getChannelById = async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const channel = await getChannelByIdService(channelId);
    if (!channel) return handleResponse(res, 404, "Channel not found");
    handleResponse(res, 200, "Channel fetched successfully", channel);
  } catch (error) { next(error); }
};

export const getAllUsersByServer = async (req, res, next) => {
  try {
    const { serverId } = req.params;
    const users = await getAllUsersByServerService(serverId);
    if (!users) return handleResponse(res, 404, "Cannot get Users successfully");
    handleResponse(res, 200, "Users fetched successfully", users);
  } catch (error) { next(error); }
};

export const deleteUserFromServer = async (req, res, next) => {
  try {
    const { serverId } = req.params;
    const userId = req.user.id
    const deletedCount = await deleteUserFromServerService(userId, serverId);
    if (!deletedCount) return handleResponse(res, 404, "User not found in this server");
    handleResponse(res, 200, "User removed from server successfully");
  } catch (error) { next(error); }
};

export const deleteServerById = async (req, res, next) => {
  try {
    const { serverId } = req.params;
    const deletedServer = await deleteServerByIdService(serverId);
    if (!deletedServer) return handleResponse(res, 404, "Cannot delete server");
    handleResponse(res, 200, "Server deleted successfully");
  } catch (error) { next(error); }
};

export const deleteChannelById = async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const deletedChannel = await deleteChannelByIdService(channelId);
    if (!deletedChannel) return handleResponse(res, 404, "Cannot delete channel");
    handleResponse(res, 200, "Channel deleted successfully");
  } catch (error) { next(error); }
};

export const createServer = async (req, res, next) => {
    try {
        const {name} = req.body;
        const ownerId = req.user.id;
        const buf = randomBytes(6);
        const inviteCode = buf.toString('hex');
        const newServer = await createServerService(name, ownerId, inviteCode);
        handleResponse(res, 201, "Server created successfully", newServer);
    } catch (error) { next(error); }
};

export const createChannelByServerId = async (req, res, next) => {
  try{
    const {serverId} = req.params;
    const { name } = req.body;
    const createdChannel = await createChannelByServerIdService(serverId, name);
    if(!createdChannel) return handleResponse(res, 404, "Cannot create a new channel");
    handleResponse(res, 200, "Channel created successfully", createdChannel);
  } catch (error) { next(error); }
};

export const kickUserFromServer = async (req, res, next) => {
  try {
    const { serverId, userId } = req.params; 
    const requesterId = req.user.id; 

    const server = await getServerByIdService(serverId);
    if (!server) return handleResponse(res, 404, "Server not found");

    if (Number(server.owner) !== Number(requesterId) && Number(server.owner_id) !== Number(requesterId)) {
      return handleResponse(res, 403, "Seul le créateur du serveur peut expulser un membre.");
    }
    
    if (Number(userId) === Number(requesterId)) {
        return handleResponse(res, 400, "Tu ne peux pas t'expulser toi-même !");
    }

    const deletedCount = await deleteUserFromServerService(userId, serverId);
    if (!deletedCount) return handleResponse(res, 404, "L'utilisateur n'est pas dans ce serveur.");

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${userId}`).emit('kicked_from_server', { serverId });
    }

    handleResponse(res, 200, "Membre expulsé avec succès.");
  } catch (error) { next(error); }
};


export const banUserFromServer = async (req, res, next) => {
  try {
    const { serverId, userId } = req.params;
    const { reason, durationHours } = req.body;
    const requesterId = req.user.id;

    const server = await getServerByIdService(serverId);
    if (!server) return handleResponse(res, 404, "Server not found");

    if (Number(server.owner) !== Number(requesterId) && Number(server.owner_id) !== Number(requesterId)) {
      return handleResponse(res, 403, "Seul le créateur peut bannir un membre.");
    }

    let expiresAt = null;
    if (durationHours) {
      expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + parseInt(durationHours));
    }

    await banUserFromServerService(serverId, userId, requesterId, reason || "Aucune raison", expiresAt);

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${userId}`).emit('kicked_from_server', { serverId });
    }

    handleResponse(res, 200, expiresAt ? "Membre banni temporairement." : "Membre banni définitivement.");
  } catch (error) { next(error); }
};