import { UserController } from "../controller/user.controller.js";
import { UserRepository } from "../repositories/user.repository.js";
import { UserService } from "../services/user.service.js";

export function makeUserController() {
    const userRepository = new UserRepository();

    const userService = new UserService({ userRepository });

    const userController = new UserController(userService);

    return userController;
}
