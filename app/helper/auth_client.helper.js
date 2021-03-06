const authHelper = require('./auth.helper')
const {_redirectToIndex, _redirectToLogin} = require('./auth.helper')
module.exports = {
  _loginWithCookie: async (req, res, next) => {
    if (req.isUnauthenticated() && req.cookies["tokens"] != null) {
      const { refreshToken } = req.cookies["tokens"]
      let resData = await authHelper.getLoggedUser({ ...req.cookies["tokens"] })

      if (resData.data && resData.data.error) {
        if (resData.status === 401 && resData.data.error.name === "TokenExpiredError") {
          try {
            const newAccessTK = await authHelper.renewAccessToken(refreshToken)
            res.clearCookie("tokens", { path: "/" })
            res.cookie(
              "tokens",
              {
                accessToken: newAccessTK,
                refreshToken: refreshToken,
                rememberMe: true,
              },
              {
                path: "/",
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
    if (req.isAuthenticated() && req.cookies["tokens"] != null) {
      const { refreshToken, rememberMe } = req.cookies["tokens"]
      const resData = await authHelper.getLoggedUser({ ...req.cookies["tokens"] })

      if (resData.data && resData.data.error) {
        if (resData.status === 401 && resData.data.error.name === "TokenExpiredError") {
          try {
            const newAccessTK = await authHelper.renewAccessToken(refreshToken)
            const expires = rememberMe ? new Date(Date.now() + 1000 * 3600 * 24 * 7) : 0
            if (newAccessTK) {
              res.clearCookie("tokens", {
                path: "/",
              })
              res.cookie(
                "tokens",
                {
                  accessToken: newAccessTK,
                  refreshToken: refreshToken,
                  rememberMe,
                },
                {
                  path: "/",
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
  
  // _checkAuthenticatedCustomer: (req, res, next) => {
  //   if (req.isAuthenticated()) {
  //     if (req.user.status === "activated") {
  //       if(req.user.role === 'user') {
  //         return next()
  //       } else if (req.user.role === 'admin') {
  //         // Log admin account
  //         req.logout()
  //         return next()
  //       }
  //     }

  //     return helper.renderForbiddenPage(res, "user")
  //   }

  //   return authHelper._redirectToLogin(req, res, next)
  // },
  
  // _checkUnauthenticatedCustomer: (req, res, next) => {
  //   if (req.isUnauthenticated()) {
  //     return next()
  //   }
    
  //   if (req.user.role === 'admin') {
  //     req.logout()
  //     return next()
  //   }

  //   return authHelper._redirectToIndex(req, res, next)
  // },
}
