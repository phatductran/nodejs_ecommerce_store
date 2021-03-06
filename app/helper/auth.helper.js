const axiosInstance = require("../helper/axios.helper")
const helper = require("../helper/helper")

module.exports = authHelper = {
  validateUser: async (username, password, role) => {
    if (typeof role === "undefined" || role == null) {
      throw new Error("Can not validate with unknown role")
    }

    try {
      const response = await axiosInstance.post(`/auth?role=${role}`, {
        username: username.toString().toLowerCase(),
        password: password.toString(),
      })

      if (response.status === 200 && response.statusText === "OK") {
        return { user: response.data }
      }
    } catch (error) {
      /**   SERVER RESPONSE
       * error: {
            name: 'ValidationError',
            message: 'Validation failed.',
            invalidation: [
              {
                field: 'password',
                message: 'Incorrect password.',
                value: '1234'
              }
            ]
        } */

      throw error
    }
  },

  renewAccessToken: async (refreshToken = null) => {
    try {
      const response = await axiosInstance.get("/token", {
        headers: { "x-refresh-token": "Bearer " + refreshToken },
      })
      if (response.status === 200) {
        return response.data.accessToken
      }
    } catch (error) {
      if (error.response.status >= 400) {
        return { error: error.response.data.error }
      }

      throw error.response.data
    }
  },

  getLoggedUser: async ({ accessToken } = {}) => {
    try {
      const response = await axiosInstance.get(`/get-user-data`, {
        headers: { Authorization: "Bearer " + accessToken },
      })

      if (response.status === 200 && response.statusText === "OK") {
        return { user: response.data }
      }
    } catch (error) {
      return error.response
    }
  },

  getProfile: async ({ accessToken } = {}) => {
    try {
      const response = await axiosInstance.get(`/profile`, {
        headers: { Authorization: "Bearer " + accessToken },
      })

      if (response.status === 200 && response.statusText === "OK") {
        const fs = require("fs")
        let profile = response.data
        if (profile.avatar.fileName != "default") {
          profile.avatar.data = fs
            .readFileSync(`tmp\\avatar\\${profile.avatar.fileName}`)
            .toString("base64")
        }
        return profile
      }
    } catch (error) {
      throw error
    }
  },

  _checkAuthenticatedAdmin: (req, res, next) => {
    if (req.isAuthenticated()) {
      // if (req.user.status === "activated" && req.user.role === "admin") {
      //   return next()
      // }

      if (req.user.status === "activated") {
        if(req.user.role === 'admin') {
          return next()
        } else if (req.user.role === 'user') {
          // Log user account
          res.redirect('/logout')
          return authHelper._redirectToLogin(req, res, next)
        }
      }

      return helper.renderForbiddenPage(res, "admin")
    }

    return authHelper._redirectToLogin(req, res, next)
  },

  _checkAuthenticatedCustomer: (req, res, next) => {
    if (req.isAuthenticated()) {
      if (req.user.status === "activated") {
        if(req.user.role === 'user') {
          return next()
        } else if (req.user.role === 'admin') {
          // Log admin account
          res.redirect('/admin/logout')
          return authHelper._loginWithCookie(req, res,next)
        }
      }

      return helper.renderForbiddenPage(res, "user")
    }

    return authHelper._redirectToLogin(req, res, next)
  },

  _checkUnauthenticatedAdmin: (req, res, next) => {
    if (req.isUnauthenticated()) {
      return next()
    }

    return authHelper._redirectToIndex(req, res, next)
  },

  _checkUnauthenticatedCustomer: (req, res, next) => {
    if (req.isUnauthenticated()) {
      return next()
    }
    
    if (req.user.role === 'admin') {
      req.logout()
      return next()
    }

    return authHelper._redirectToIndex(req, res, next)
  },

  _redirectToIndex: (req, res, next) => {
    const urlSegments = req.originalUrl.split("/")
    const admin = urlSegments.find((element) => element === "admin")

    if (admin != null) return res.redirect("/admin")

    return res.redirect("/")
  },

  _redirectToLogin: (req, res, next) => {
    const urlSegments = req.originalUrl.split("/")
    const admin = urlSegments.find((element) => element === "admin")

    if (admin != null) return res.redirect("/admin/login")

    return res.redirect("/login")
  },

  _loginWithCookie: async (req, res, next) => {
    if (req.isUnauthenticated() && req.cookies["adminTokens"] != null) {
      const { refreshToken } = req.cookies["adminTokens"]
      let resData = await authHelper.getLoggedUser({ ...req.cookies["adminTokens"] })

      if (resData.data && resData.data.error) {
        if (resData.status === 401 && resData.data.error.name === "TokenExpiredError") {
          try {
            const newAccessTK = await authHelper.renewAccessToken(refreshToken)
            res.clearCookie("adminTokens", { path: "/admin" })
            res.cookie(
              "adminTokens",
              {
                accessToken: newAccessTK,
                refreshToken: refreshToken,
                rememberMe: true,
              },
              {
                path: "/admin",
                httpOnly: true,
                secure: false,
                expires: new Date(Date.now() + 1000 * 3600 * 24 * 7),
              }
            )
            resData = await authHelper.getLoggedUser({
              accessToken: newAccessTK,
              refreshToken,
              rememberMe: true,
            })
          } catch (error) {
            throw error
          }
        }
      }

      if (resData.user) {
        return req.logIn(resData.user, function (err) {
          if (err) {
            throw err
          }

          return next()
        })
      }
    }

    return next()
  },

  _autoRenewAccessToken: async (req, res, next) => {
    if (req.isAuthenticated() && req.cookies["adminTokens"] != null) {
      const { refreshToken, rememberMe } = req.cookies["adminTokens"]
      const resData = await authHelper.getLoggedUser({ ...req.cookies["adminTokens"] })

      if (resData.data && resData.data.error) {
        if (resData.status === 401 && resData.data.error.name === "TokenExpiredError") {
          try {
            const newAccessTK = await authHelper.renewAccessToken(refreshToken)
            const expires = rememberMe ? new Date(Date.now() + 1000 * 3600 * 24 * 7) : 0
            if (newAccessTK) {
              res.clearCookie("adminTokens", {
                path: "/admin",
              })
              res.cookie(
                "adminTokens",
                {
                  accessToken: newAccessTK,
                  refreshToken: refreshToken,
                  rememberMe,
                },
                {
                  path: "/admin",
                  httpOnly: true,
                  secure: false,
                  expires,
                }
              )
              return next()
            }
          } catch (error) {
            throw error
          }
        }
      }
    }

    return next()
  },
}
