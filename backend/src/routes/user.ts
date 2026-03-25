import express from "express";
const userRoutes=express.Router();
import{register,login, updateUser, deleteUser, logoutUser, getUserProfile, getUsers} from "../controllers/user"
import { protect, authorize } from "../middleware/auth.ts";


userRoutes.post("/login",login);
userRoutes.post("/logout", logoutUser);
userRoutes.get("/profile", protect, getUserProfile);
userRoutes.get("/",protect,authorize(["admin","teacher"]),getUsers);
userRoutes.post("/register",protect,authorize(["admin","teacher"]),register);
userRoutes.put("/update/:id",protect,authorize(["admin","teacher"]),updateUser);
userRoutes.delete("/delete/:id",protect,authorize(["admin","teacher"]),deleteUser);
export default userRoutes;
