const bcrypt = require("bcrypt")
const UserModel = require("../models/UserModel")
const validator = require("validator")
const TokenObject = require("./TokenObject")
const { isExistent } = require("../helper/validation")
const TokenError = require("../errors/token")
const ObjectError = require("../errors/object")
const ValidationError = require("../errors/validation")
const connectMongo = require("connect-mongo")
const MongooseError = require("mongoose").Error
const USER_ROLES = ["user", "admin"]
const STATUS_VALUES = ["deactivated", "activated"]

class UserObject {
  constructor({
    _id,
    username,
    email,
    password,
    status,
    role,
    profileId,
    // accessToken,
    // refreshToken,
    // refresh_secret,
  } = {}) {
    this.id = _id
    this.username = username
    this.email = email
    this.password = password
    this.role = role
    this.status = status
    this.profileId = profileId
  }

  // ==== GET & SET ====
  set setAccessToken(accessToken) {
    this.accessToken = accessToken
  }

  get getAccessToken() {
    return this.accessToken
  }

  set setRefreshToken(refreshToken) {
    this.refreshToken = refreshToken
  }

  get getRefreshToken() {
    return this.refreshToken
  }

  set setRefreshSecret(refresh_secret) {
    this.refresh_secret = refresh_secret
  }

  get getRefreshSecret() {
    return this.refresh_secret
  }

  set setStatus(status) {
    this.status = status
  }

  get getStatus() {
    return this.status
  }

  // @desc:     Get user by criteria
  // @return:   UserObject
  static async getOneUserBy(criteria = {}, selectFields = null) {
    try {
      const user = await UserModel.findOne(criteria, selectFields).lean()
      const userObject = new UserObject({ ...user })
      // Avoid showing tokens
      delete userObject.accessToken
      delete userObject.refreshToken
      // delete userObject.refresh_secret

      return userObject
    } catch (error) {
      if (error instanceof require("mongoose").Error && error.kind === "ObjectId") {
        throw new Error("Id is not valid.")
      } else {
        throw new Error(error)
      }
    }
  }

  // @desc:     Get list of users by criteria
  // @return:   UserObject[]
  static async getUsersBy(criteria = {}, selectFields = null) {
    try {
      const listOfUsers = await UserModel.find(criteria, selectFields).lean()
      let userObjects = new Array()
      listOfUsers.forEach((element) => {
        const object = new UserObject({ ...element })
        object.clean()
        // Avoid showing tokens
        delete object.accessToken
        delete object.refreshToken
        // delete object.refresh_secret

        userObjects.push(object)
      })

      return userObjects
    } catch (error) {
      throw new Error(error)
    }
  }

  // @desc:     Reset pwd by email
  static async resetPwd(email = null) {
    if (email == null || ! (await isExistent(UserModel, { email: email }))) {
      throw new TypeError("Email is null or not existent")
    }

    try {
      const user = await this.getOneUserBy({ email: email })
      if (user) {
        user.setStatus = "reset password"
        await user.save()
        // send email
        
        //
        return true
      }
      return false
    } catch (error) {
      console.log(error)
      throw new Error(error)
    }
  }

  // @fields:   [username, email, password, role, status]
  // @return:   Failed  =>  {ErrorObject}
  //            Valid   =>  {UserObject}
  async validate(type = "create", exceptionId = null) {
    let errors = new Array()

    // === CREATE === ----------  Required fields
    if (type === "create") {
      if (typeof this.username === "undefined" || validator.isEmpty(this.username)) {
        errors.push({
          field: "username",
          message: "Must be required.",
        })
      }

      if (typeof this.email === "undefined" || validator.isEmpty(this.email)) {
        errors.push({
          field: "email",
          message: "Must be required.",
        })
      }
    }

    if (errors.length > 0) {
      // has errors
      throw new ValidationError(errors)
    }
    // username   [required]
    if (typeof this.username !== "undefined" && !validator.isEmpty(this.username)) {
      const _username = this.username.toLowerCase()
      if (!validator.isAlphanumeric(_username)) {
        errors.push({
          field: "username",
          message: "Must be only numbers and characters.",
          value: _username,
        })
      }
      if (!validator.isLength(_username, { min: 4, max: 255 })) {
        errors.push({
          field: "username",
          message: "Must be from 4 to 255 characters.",
          value: _username,
        })
      }
      if (await isExistent(UserModel, { username: _username }, exceptionId)) {
        errors.push({
          field: "username",
          message: "Username is already existent.",
          value: _username,
        })
      }
    }

    // email [required]
    if (typeof this.email !== "undefined" && !validator.isEmpty(this.email)) {
      const _email = this.email.toLowerCase()
      if (!validator.isEmail(_email)) {
        errors.push({
          field: "email",
          message: "Email is not valid.",
          value: _email,
        })
      }
      if (!validator.isLength(_email, { max: 255 })) {
        errors.push({
          field: "email",
          message: "Must be less than 256 characters.",
          value: _email,
        })
      }
      if (await isExistent(UserModel, { email: _email }, exceptionId)) {
        errors.push({
          field: "email",
          message: "Email is already existent.",
          value: _email,
        })
      }
    }

    // role
    if (this.role != null) {
      if (!USER_ROLES.find((element) => element === this.role.toLowerCase())) {
        errors.push({
          field: "role",
          message: "The value of the field 'role' is not valid.",
          value: this.role,
        })
      }
    }

    // status
    if (this.status != null) {
      if (!STATUS_VALUES.find((element) => element === this.status.toLowerCase())) {
        errors.push({
          field: "status",
          message: "The value of the field 'status' is not valid.",
          value: this.status,
        })
      }
    }

    if (errors.length > 0) {
      // has errors
      throw new ValidationError(errors)
    } else {
      return this
    }
  }

  // @desc:     Remove undefined props and lowercase fields.
  clean() {
    let userObject = this
    const lowerCaseFields = ["username", "email", "role", "status"]
    for (const [key, value] of Object.entries(userObject)) {
      if (value != null) {
        const isFound = lowerCaseFields.find((field, value) => key === field)
        if (isFound) {
          userObject[key] = value.toString().toLowerCase()
        }
      }

      if (typeof value === "undefined") {
        delete userObject[key]
      }
    }

    return userObject
  }

  // @desc:     Update an user
  // @return:   <Boolean> True
  // static async update(criteria = {}, info = {}) {
  //   let userObject = new UserObject({ ...info })

  //   if (JSON.stringify(criteria) !== '{}' && criteria._id == null){
  //     throw new Error("Can not update with undefined or null of criteria._id ")
  //   }

  //   try {
  //     const validation = await userObject.validate("update", criteria._id)
  //     if (validation instanceof UserObject) {
  //       await UserModel.updateOne(criteria, info)
  //       return true
  //     }
  //   } catch (error) {
  //     if (error instanceof ValidationError) {
  //       throw new ValidationError(error.validation)
  //     } else {
  //       throw new Error(error)
  //     }
  //   }
  // }

  // @desc:     Create a user
  // @fields:   [username, email, password, role, status]
  // @return:   UserObject
  static async create({ username, email, password, role, status } = {}) {
    let userObject = new UserObject({ username, email, password, role, status })
    try {
      await userObject.validate()
      if (password == null) {
        throw new ValidationError([
          {
            name: "password",
            message: "Must be required.",
          },
        ])
      }

      userObject.password = await bcrypt.hash(password, await bcrypt.genSalt())
      userObject = userObject.clean() // set [role, status] to default if not provided.
      await UserModel.create(userObject)
      return await this.getOneUserBy({ username: userObject.username })
    } catch (error) {
      console.log(error)
      if (error instanceof ValidationError) {
        throw new ValidationError(error.validation)
      } else {
        throw new Error(error)
      }
    }
  }

  // @desc:     Update
  // @return:   <Boolean> True
  async update(info = {}) {
    if (this.id == null) {
      throw new TypeError("Can not update with undefined or null Id.")
    }

    let userObject = new UserObject({ ...info })
    try {
      const validation = await userObject.validate("update", this.id)
      if (validation instanceof UserObject) {
        await UserModel.updateOne({ _id: this.id }, info)
        return true
      }
      return false
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new ValidationError(error.validation)
      } else {
        throw new Error(error)
      }
    }
  }

  // @desc:     Get user by a token
  // @return:   UserObject
  static async getDataByToken(type = null, token = null) {
    if (!type) {
      throw new TypeError("Type can not be null or undefined.")
    } else if (typeof type !== "string") {
      throw new TypeError("Type must be a string.")
    } else if (type !== "access" && type !== "refresh") {
      throw new TypeError(`Type '${type}' is not valid.`)
    }

    if (token == null) {
      throw new TypeError("Can not get data with a null or undefined token.")
    }

    let condition = null
    if (type === "access") {
      condition = { accessToken: token }
    } else if (type === "refresh") {
      condition = { refreshToken: token }
    }

    if (condition != null && token != null) {
      try {
        const user = await UserModel.findOne({ ...condition }).lean()
        if (user != null) {
          const userObject = new UserObject({ ...user })
          userObject.setRefreshSecret = user.refresh_secret
          userObject.setAccessToken = user.accessToken
          userObject.setRefreshToken = user.refreshToken
          return userObject
        }

        throw new TokenError(token)
      } catch (error) {
        if (error instanceof TokenError) {
          throw new TokenError({
            name: "InvalidTokenError",
            message: "Token is not valid.",
          })
        } else {
          throw new Error(error)
        }
      }
    } else {
      throw new TypeError("Can not get data with undefined or null of either type or token")
    }
  }

  // @desc:   Initialize tokens if necessary
  // accessToken:   (token == null) || (expired) => Generate
  // refreshToken:  (token == null)  =>  Generate
  initializeTokens() {
    const token = new TokenObject()
    try {
      token.setPayload = { ...this }

      if (this.refreshToken == null) {
        this.refreshToken = token.generateToken("refresh", this.refresh_secret)
      }

      if (this.accessToken == null) {
        this.accessToken = token.generateToken("access")
      } else {
        // Invoke to catch expiration error
        TokenObject.verifyToken("access", this.accessToken)
      }
    } catch (error) {
      if (error instanceof TokenError) {
        // expired
        if (error.data.name === "TokenExpiredError") {
          this.accessToken = token.generateToken("access")
        } else {
          throw new TokenError(error.data)
        }
      } else {
        throw new Error(error)
      }
    }

    return true
  }

  // @return:   void
  async save() {
    const userToSave = this.clean()
    if (this.id != null) {
      try {
        await UserModel.updateOne({ _id: userToSave.id }, { ...userToSave }).lean()
      } catch (error) {
        throw new Error(error)
      }
    } else {
      throw new ObjectError({
        name: "UserObject",
        message: "Can not save object with undefined or null id.",
        instance: userToSave,
      })
    }
  }

  // @return:   void
  async remove() {
    const userToRemove = this.clean()
    if (this.id != null) {
      try {
        await UserModel.findOneAndDelete({ _id: userToRemove.id })
      } catch (error) {
        throw new Error(error)
      }
    } else {
      throw new ObjectError({
        name: "UserObject",
        message: "Can not delete object with undefined or null id.",
        instance: userToRemove,
      })
    }
  }
}

module.exports = UserObject