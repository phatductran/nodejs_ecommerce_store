const ContactModel = require('../models/ContactModel')
const { isExistent, hasSpecialChars, STATUS_VALUES } = require('../helper/validation')
const validator = require('validator')
const ValidationError = require('../errors/validation')


class ContactObject {
  constructor({_id, subject, email, message, status, createdAt}){
    this.id = _id
    this.subject = subject
    this.email = email
    this.message = message
    this.status = status
    this.createdAt = createdAt
  }

  static async getOneContactBy(criteria = {}, selectFields = null) {
    try {
      let contact = await ContactModel.findOne(criteria, selectFields).lean()
      if (contact) {
        contact = new ContactObject({...contact})
        return contact
      }

      return null
    } catch (error) {
      throw error
    }
  }

  static async getContactsBy (criteria = {}, selectFields = null) {
    try {
      const contacts = await ContactModel.find(criteria, selectFields).lean()
      if (contacts.length > 0) {
        let contactList = new Array()
        
        contacts.forEach((element) => {
          const object = new ContactObject({ ...element })
          contactList.push(object)
        })

        return contactList 
      }

      return null
    } catch (error) {
      throw error
    }
  }

  async validate(type = 'create') {
    let errors = new Array()

    if (type === 'create') {
      if (this.subject == null || validator.isEmpty(this.subject)) {
        errors.push({
          field: 'subject',
          message: "Must be required."
        })
      }
      if (this.email == null || validator.isEmpty(this.email)) {
        errors.push({
          field: 'email',
          message: "Must be required."
        })
      }
      if (this.message == null) {
        errors.push({
          field: 'message',
          message: "Must be required."
        })
      }

      if (errors.length > 0) {
        throw new ValidationError(errors)
      }
    }

    // name
    if (typeof this.subject !== "undefined" && !validator.isEmpty(this.subject)) {
      if (hasSpecialChars(this.subject)) {
        errors.push({
          field: 'subject',
          message: "Must contain only numbers,characters and spaces."
        })
      }
      if (!validator.isLength(this.subject, { min: 4, max: 250 })) {
        errors.push({
          field: 'subject',
          message: "Must be from 4 to 250 characters."
        })
      }
    }
    // email
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
    }
    // message
    if (typeof this.message !== "undefined" && !validator.isEmpty(this.message)) {
      if (hasSpecialChars(this.message)) {
        errors.push({
          field: 'message',
          message: "Must contain only numbers,characters and spaces."
        })
      }
      if (!validator.isLength(this.message, { min: 4, max: 400 })) {
        errors.push({
          field: 'message',
          message: "Must be from 4 to 400 characters."
        })
      }
    }
    // status
    if (typeof this.status !== "undefined" && !validator.isEmpty(this.status)) {
        if (!validator.isIn(this.status.toLowerCase(), STATUS_VALUES)) {
          errors.push({
            field: 'status',
            message: "Not valid."
          })
        }
    }

    if (errors.length > 0){
      throw new ValidationError(errors)
    }else {
      return this
    }
  }

  clean() {
    let contactObject = this
    const fieldsToClean = ["name", "propertyType", "capacity", "description", "status"]
    for (const [key, value] of Object.entries(contactObject)) {
      if (value != null) {
        const isFound = fieldsToClean.find((field) => key === field)
        if (isFound) {
          if (key === 'subject') {
            contactObject[key] = validator.trim(value.toString())
          }
          if (key === 'message') {
            contactObject[key] = validator.trim(value.toString())
          }
          if (key === 'email') {
            contactObject[key] = validator.trim(value.toString().toLowerCase())
          }
          if (key === 'status') {
            contactObject[key] = validator.trim(value.toString().toLowerCase())
          }
        }
        
        if (key === 'updatedAt') {
          contactObject[key] = Date.now()
        }
      }

      if (typeof value === "undefined") {
        delete contactObject[key]
      }
    }
    
    return contactObject
  }

  static async create({...contactData}) {
    try {
      let contactObject = new ContactObject({...contactData})
      contactObject = contactObject.clean()
      const validation = await contactObject.validate('create')
      if (validation) {
        const createdContact = await ContactModel.create({...validation})
        if (createdContact){
          const contact = new ContactObject({...createdContact})
          return contact
        }
      }
      
      throw new Error("Failed to create contact.")
    } catch (error) {
      throw error
    }
  }

  async update (updateData = {}) {
    if (this.id == null) {
      throw new ObjectError({
        objectName: 'ContactObject',
        errorProperty: 'Id',
        message: 'Id is not valid.'
      })
    }

    if (!(await isExistent(ContactModel, { _id: this.id }))) {
      throw new ObjectError({
        objectName: 'ContactObject',
        errorProperty: 'Id',
        message: 'Id is not valid.'
      })
    }

    try {
      let updateObject = new ContactObject({ ...updateData })
      updateObject = updateObject.clean()
      const validation = await updateObject.validate("update")
      if (validation) {
        const updated = new ContactObject(
          await ContactModel.findOneAndUpdate({ _id: this.id }, { ...validation }, { new: true })
        )
        
        return updated
      }

      throw new Error("Failed to update.")
    } catch (error) {
      throw error
    }
  }

  async save() {
    if (this.id == null) {
      throw new ObjectError({
        objectName: 'ContactObject',
        errorProperty: 'Id',
        message: 'Id is not valid.'
      })
    }

    try {
      const isSaved = await ContactModel.findOneAndUpdate({_id: this.id}).lean()
      if (isSaved) {
        return new ContactObject({...isSaved})
      }

      throw new Error("Failed to save storage.")
    } catch (error) {
      throw error
    }
  }

  async remove() {
    if (this.id == null) {
      throw new ObjectError({
        objectName: 'ContactObject',
        errorProperty: 'Id',
        message: 'Id is not valid.'
      })
    }

    try {
      const isRemoved = await ContactModel.findOneAndDelete({_id: this.id}).lean()
      if (isRemoved) {
        return new ContactObject({...isRemoved})
      }

      throw new Error("Failed to remove contact.")
    } catch (error) {
      throw error
    }
  }

}

module.exports = ContactObject