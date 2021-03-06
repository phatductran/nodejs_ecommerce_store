const axiosInstance = require("../../helper/axios.helper")
const helper = require("../../helper/helper")
const getVoucherById = async function(accessToken, voucherId) {
  try {
    const response = await axiosInstance.get(`/admin/vouchers/${voucherId}`,
    {
      headers: {
        Authorization: 'Bearer ' + accessToken
      }
    })

    if (response.status === 200) {
      return response.data
    }
  } catch (error) {
    throw error 
  }
}
const getVoucherData = function(reqBody) {
  reqBody = JSON.parse(JSON.stringify(reqBody))
  return {
    name: reqBody.name,
    code: reqBody.code,
    rate: reqBody.rate,
    minValue: reqBody.minValue,
    maxValue: reqBody.maxValue,
    validUntil: helper.toDateFormat(reqBody.validUntil),
    status: reqBody.status
  }
}

module.exports = {
  // @desc:   Show vouchers
  // @route   GET /vouchers
  showVoucherList: async (req, res) => {
    try {
      const response = await axiosInstance.get("/admin/vouchers", {
        headers: {
          Authorization: "Bearer " + req.user.accessToken,
        },
      })

      if (response.status === 200) {
        return res.render("templates/admin/voucher/voucher.hbs", {
          layout: "admin/main.layout.hbs",
          content: "list",
          header: "List of vouchers",
          route: "vouchers",
          vouchers: response.data,
          user: await helper.getUserInstance(req),
          csrfToken: req.csrfToken(),
        })
      }
    } catch (error) {
      return helper.handleErrors(res, error, "admin")
    }
  },

  // @desc:   Get vouchers by Id
  // @route   GET /vouchers/:id
  viewVoucherById: async (req, res) => {
    // res.render('templates/admin/voucher',{
    //     layout: 'admin/table.layout.hbs'
    // })
  },

  // @desc    show create form
  // @route   GET /vouchers/add
  showCreateVoucherForm: async (req, res) => {
    return res.render("templates/admin/voucher/voucher.hbs", {
      layout: "admin/main.layout.hbs",
      content: "form",
      formType: "create",
      header: "Create a new voucher",
      route: "vouchers",
      user: await helper.getUserInstance(req),
      csrfToken: req.csrfToken(),
    })
  },

  // @desc    show create form
  // @route   POST /vouchers/add
  createVoucher: async (req, res) => {
    let voucherData = getVoucherData(req.body)
    
    try {
      const response = await axiosInstance.post("/admin/vouchers", 
      voucherData, 
      {
        headers: {
          Authorization: "Bearer " + req.user.accessToken,
        },
      })

      if (response.status === 201) {
        req.flash("success", "You have created a new voucher.")
        return res.render("templates/admin/voucher/voucher.hbs", {
          layout: "admin/main.layout.hbs",
          content: "form",
          formType: "create",
          header: "Add a new voucher",
          route: "vouchers",
          user: await helper.getUserInstance(req),
          csrfToken: req.csrfToken(),
        })
      }
    } catch (error) {
      if (error.response.status === 400) {
        //ValidationError
        const errors = error.response.data.error.invalidation
        const validData = helper.getValidFields(errors, req.body)

        req.flash("fail", "Your input is not valid. Please check and then fill in again.")
        return res.render("templates/admin/voucher/voucher.hbs", {
          layout: "admin/main.layout.hbs",
          content: "form",
          formType: "create",
          header: "Add a new voucher",
          route: "vouchers",
          csrfToken: req.csrfToken(),
          user: await helper.getUserInstance(req),
          errors: helper.handleInvalidationErrors(errors),
          validData: validData,
        })
      }

      return helper.handleErrors(res, error, "admin")
    }
  },

  // @desc    Update voucher
  // @route   GET /vouchers/edit/:id
  showUpdateVoucherForm: async (req, res) => {
    try {
      const voucher = await getVoucherById(req.user.accessToken,req.params.id)

      if (voucher) {
        return res.render("templates/admin/voucher/voucher.hbs", {
          layout: "admin/main.layout.hbs",
          content: "form",
          formType: "update",
          header: "Update voucher",
          route: "vouchers",
          voucher: voucher,
          user: await helper.getUserInstance(req),
          csrfToken: req.csrfToken(),
        })
      }
    } catch (error) {
      return helper.handleErrors(res, error, "admin")
    }
  },

  // @desc    Update voucher
  // @route   PUT /vouchers/edit/:id
  updateVoucherById: async (req, res) => {
    let voucherData = {}

    try {
      const voucher = await getVoucherById(req.user.accessToken, req.params.id)
      if (voucher) {
        voucherData = helper.getFilledFields(getVoucherData(req.body), voucher)
      }

      const response = await axiosInstance.put(`/admin/vouchers/${req.params.id}`, 
      voucherData, 
      {
        headers: {
          Authorization: "Bearer " + req.user.accessToken,
        },
      })

      if (response.status === 204) {
        req.flash("success", "Your changes were completely saved.")
        return res.render("templates/admin/voucher/voucher.hbs", {
          layout: "admin/main.layout.hbs",
          content: "form",
          formType: "update",
          header: "Update voucher",
          voucher: await getVoucherById(req.user.accessToken, req.params.id),
          route: "vouchers",
          user: await helper.getUserInstance(req),
          csrfToken: req.csrfToken(),
        })
      }
    } catch (error) {
      if (error.response.status === 400) {
        //ValidationError
        const errors = error.response.data.error.invalidation
        const validData = helper.getValidFields(errors, voucherData)

        req.flash("fail", "Your input is not valid. Please check and then fill in again.")
        return res.render("templates/admin/voucher/voucher.hbs", {
          layout: "admin/main.layout.hbs",
          content: "form",
          formType: "update",
          header: "Update voucher",
          route: "vouchers",
          csrfToken: req.csrfToken(),
          user: await helper.getUserInstance(req),
          voucher: await getVoucherById(req.user.accessToken, req.params.id),
          errors: helper.handleInvalidationErrors(errors),
          validData: validData,
        })
      }

      return helper.handleErrors(res, error, "admin")
    }
  },

  // @desc    Deactivate voucher
  // @route   PUT /vouchers/deactivate/:id
  deactivateVoucherById: async (req, res) => {
    try {
      const response = await axiosInstance.put(
        `/admin/vouchers/${req.params.id}`,
        {
          status: "deactivated",
        },
        {
          headers: {
            Authorization: "Bearer " + req.user.accessToken,
          },
        }
      )

      if (response.status === 204) {
        return res.sendStatus(200)
      }
    } catch (error) {
      return helper.handleErrors(res, error, "admin")
    }
  },

  // @desc    Activate voucher
  // @route   PUT /vouchers/activate/:id
  activateVoucherById: async (req, res) => {
    try {
      const response = await axiosInstance.put(
        `/admin/vouchers/${req.params.id}`,
        {
          status: "activated",
        },
        {
          headers: {
            Authorization: "Bearer " + req.user.accessToken,
          },
        }
      )

      if (response.status === 204) {
        return res.sendStatus(200)
      }
    } catch (error) {
      return helper.handleErrors(res, error, "admin")
    }
  },

  // @desc    Delete voucher
  // @route   DELETE /vouchers/:id
  removeVoucherById: async (req, res) => {
    try {
      const response = await axiosInstance.delete(`/admin/vouchers/${req.params.id}`, {
        headers: {
          Authorization: "Bearer " + req.user.accessToken,
        },
      })

      if (response.status === 204) {
        return res.sendStatus(200)
      }
    } catch (error) {
      return helper.handleErrors(res, error, "admin")
    }
  },
}
