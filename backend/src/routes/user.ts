import express from "express";
const userRoutes=express.Router();
import{register,login, updateUser, deleteUser, logoutUser, getUserProfile, getUsers, setParentChildren, getMyChildren, getStudentPerformance, getMyPerformance, getMyPrediction} from "../controllers/user"
import { protect, authorize } from "../middleware/auth.ts";


userRoutes.post("/login",login);
userRoutes.post("/logout", logoutUser);
userRoutes.get("/profile", protect, getUserProfile);
userRoutes.get("/",protect,authorize(["admin","teacher"]),getUsers);
userRoutes.post("/register",protect,authorize(["admin","teacher"]),register);
userRoutes.put("/update/:id",protect,authorize(["admin","teacher"]),updateUser);
userRoutes.delete("/delete/:id",protect,authorize(["admin","teacher"]),deleteUser);
userRoutes.get("/my-children", protect, authorize(["parent"]), getMyChildren);
userRoutes.get("/me/performance", protect, getMyPerformance);
userRoutes.get("/me/prediction", protect, getMyPrediction);
userRoutes.put("/:id/children", protect, authorize(["admin"]), setParentChildren);
userRoutes.get("/:id/performance", protect, authorize(["admin", "teacher"]), getStudentPerformance);
export default userRoutes;
