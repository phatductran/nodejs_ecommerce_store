const router = require('express').Router()
const {_checkAuthenticatedAdmin} = require('../../helper/auth.helper')
const authRouter = require('./auth.route')
const indexRouter = require('./index.route')
const profileRouter = require('./profile.route')
const administratorRouter = require('./administrator.route')
const customerRouter = require('./customer.route')
const categoryRouter = require('./category.route')
const providerRouter = require('./provider.route')
const orderRouter = require('./order.route')
const voucherRouter = require('./voucher.route')
const restockRouter = require('./restock.route')
const storageRouter = require('./storage.route')
const productRouter = require('./product.route')

router.use(authRouter)
router.use(_checkAuthenticatedAdmin)
router.use(indexRouter)
router.use(profileRouter)
router.use('/customers', customerRouter)
router.use('/administrators', administratorRouter)

module.exports = router