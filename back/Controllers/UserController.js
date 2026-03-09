import { 
    getAllUserService, 
    getUserByIdService, 
    createUserService, 
} from "../Models/UserModel.js";
import bcrypt from "bcrypt";
import pool from "../Config/DataBase.js"; // Ajout de pool

const handleResponse = (res, status, message, data = null) => {
    res.status(status).json({
        status, message, data
    });
};

export const getAllUser = async (req, res, next) => {
    try {
        const allUsers = await getAllUserService();
        handleResponse(res, 200, "Users fetched successfully", allUsers)
    } catch (error) {
        next(error);
    }
}

export const getUser = async (req, res, next) => {
    try {
        const User = await getUserByIdService(req.params.id);
        if(!User) return handleResponse(res, 404, "User not found")
        handleResponse(res, 200, "User fetched successfully", User)
    } catch (error) {
        next(error);
    }
}

export const createUser = async (req, res, next) => {
    try {
        const {name, first_name, phone_number, mail, password} = req.body;
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds)

        const newUser = await createUserService(
            name,
            first_name,
            phone_number,
            mail,
            hashedPassword,
        );

        handleResponse(res, 201, "User created successfully", newUser);
    } catch (error) {
        next(error);
    }
};

// --- NOUVEAU CODE POUR L'HISTORIQUE DES MP ---
export const getPrivateMessages = async (req, res, next) => {
  try {
    const senderId = req.user.id;
    const { receiverId } = req.params;

    // Récupère la conversation complète entre 2 utilisateurs
    const result = await pool.query(
      `SELECT * FROM private_messages 
       WHERE (sender_id = $1 AND receiver_id = $2) 
          OR (sender_id = $2 AND receiver_id = $1)
       ORDER BY created_at ASC`,
      [senderId, receiverId]
    );

    handleResponse(res, 200, "Messages fetch", result.rows);
  } catch (error) {
    next(error);
  }
};


// export const updateUser = async (req, res, next) => {
//     const {name, first_name, phone_number, mail, hashedPassword} = req.body
//     console.log(req.body);
//     try {
//         const updatedUser = await updateUserByIdService(
//             req.params.id,
//             name,
//             first_name,
//             phone_number,
//             mail,
//             hashedPassword,
//         );
//         if(!updatedUser) return handleResponse(res, 404, "User not found")
//         handleResponse(res, 200, "User updated successfully", updatedUser)
//     } catch (error) {
//         next(error);
//     }
// }

// export const deleteUser = async (req, res, next) => {
//     try {
//         const deletedUser = await deleteUserByIdService(req.params.id);
//         if(!deletedUser) return handleResponse(res, 404, "User not found")
//         handleResponse(res, 200, "User deleted successfully", deletedUser)
//     } catch (error) {
//         next(error);
//     }
// }