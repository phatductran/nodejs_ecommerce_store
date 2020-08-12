const validator = require("validator")
const { hasUnknownKeys, isExistent,
    STATUS_VALUES, CATEGORY_FIELDS } = require("./validation")

module.exports = async function validate({ ...data } = {}, categoryId) {
    if (JSON.stringify(data) === "{}") {
        throw new Error("No input data")
    }
    const unknownKeys = hasUnknownKeys(CATEGORY_FIELDS, Object.keys(data))
    if (unknownKeys.length > 0) {
        throw new Error(`Unknown input [${unknownKeys[0]}]`)
    }
    if (typeof data.name !== "undefined" && !validator.isEmpty(data.name)) {
        if (!validator.isAlphanumeric(data.name)){
            throw new Error('Name must contain only numbers and characters.')
        }
        if (!validator.isLength(data.name, { min: 4, max: 50 })) {
            throw new Error("name must be from 4 to 50 characters.")
        }
        if (await isExistent(require('../models/CategoryModel'), {name: data.name}, categoryId)) {
            throw new Error('name is already existent.')
        }
    }
    if (typeof data.status !== "undefined" && !validator.isEmpty(data.status)) {
        if (!validator.isIn(data.status.toLowerCase(), STATUS_VALUES)) {
            throw new Error("status is not valid.")
        }
    }
    return true
}
