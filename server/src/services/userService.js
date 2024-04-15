let db = require("../models/index");
import bcrypt, { hash } from "bcryptjs"; // dung de hash password
import { where } from "sequelize";
const salt = bcrypt.genSaltSync(10);

let handleUserLogin = (email, password) => {
  return new Promise(async (resolve, reject) => {
    try {
      let userData = {};
      let isExist = await checkUserEmail(email);
      if (isExist) {
        let user = await db.User.findOne({
          attributes: ["email", "roleId", "password"],
          where: { email: email },
          raw: true,
        });
        if (user) {
          //compare password
          let checkPassword = bcrypt.compareSync(password, user.password);
          delete user.password;
          if (checkPassword) {
            userData.errCode = 0;
            userData.errMessage = "Login successfully";
          } else {
            userData.errCode = 3;
            userData.errMessage = "Password is not true";
          }
        } else {
          userData.errCode = 2;
          userData.errMessage = "User email is not exist";
        }
        userData.user = user;
        resolve(userData);
      } else {
        userData.errCode = 1;
        userData.errMessage = `Yours's email isn't exist in your system. Please try other email`;
        userData.user = {};
        resolve(userData);
      }
    } catch (e) {
      reject(e);
    }
  });
};

let checkUserEmail = (userEmail) => {
  return new Promise(async (resolve, reject) => {
    try {
      let user = await db.User.findOne({
        where: {
          email: userEmail,
        },
      });
      if (user) {
        resolve(true);
      } else {
        resolve(false);
      }
    } catch (e) {
      reject(e);
    }
  });
};

let getAllUser = async (userId) => {
  return new Promise(async (resolve, reject) => {
    try {
      let users = "";
      if (userId == "ALL") {
        users = await db.User.findAll({
          attributes: {
            exclude: ["password"],
          },
        });
      }
      if (userId && userId != "ALL") {
        users = await db.User.findOne({
          attributes: {
            exclude: ["password"],
          },
          where: { id: userId },
        });
      }
      resolve(users);
    } catch (e) {
      reject(e);
    }
  });
};

let createNewUser = async (newUser) => {
  return new Promise(async (resolve, reject) => {
    try {
      //check xem email da ton tai chua
      if(!newUser.email || !newUser.password) {
        resolve({
          errCode: 1,
          errMessage: 'Missing email or password'
        })
      }
      let check = await checkUserEmail(newUser.email);
      if (check) {
        resolve({
          errCode: 1,
          errMessage:
            "Your email existed in database, please try another email",
        });
      } else {
        let hashPasswordFromBcrypt = await hashUserPassword(newUser.password);
        await db.User.create({
          email: newUser.email,
          password: hashPasswordFromBcrypt,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          address: newUser.address,
          phoneNumber: newUser.phoneNumber,
          gender: newUser.gender == 1 ? true : false,
        });
        resolve({
          errCode: 0,
          errMessage: "Create new user success",
        });
      }
    } catch (e) {
      reject(e);
    }
  });
};

let hashUserPassword = (password) => {
  return new Promise(async (resolve, reject) => {
    try {
      let hashPassword = await bcrypt.hashSync(password, salt);
      resolve(hashPassword);
    } catch (e) {
      reject(e);
    }
  });
};

let updateUserData = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!data.id) {
        resolve({
          errCode: 2,
          errMessage: "Missing id parameter",
        });
      }
      let user = await db.User.findOne({
        where: { id: data.id },
      });
      if (user) {
        user.firstName = data.firstName;
        user.lastName = data.lastName;
        user.address = data.address;
        await user.save();
        resolve({
          errCode: 0,
          errMessage: "Update user success",
        });
      } else {
        resolve({
          errCode: 2,
          errMessage: "User is not exists",
        });
      }
    } catch (e) {
      reject(e);
    }
  });
};

let deleteUser = (userId) => {
  return new Promise(async (resolve, reject) => {
    try {
      let user = await db.User.findOne({
        where: { id: userId },
      });
      if (!user) {
        resolve({
          errCode: 2,
          errMessage: `The user isn't exist`,
        });
      } else {
        await db.User.destroy({
          where: { id: userId },
        });
        resolve({
          errCode: 0,
          errMessage: `The user deleted`,
        });
      }
    } catch (e) {
      reject(e);
    }
  });
};



module.exports = {
  handleUserLogin,
  getAllUser,
  createNewUser,
  updateUserData,
  deleteUser,
};
