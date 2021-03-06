const ContactObject = require("../objects/ContactObject")
const ErrorHandler = require('../helper/errorHandler')
const NotFoundError = require('../errors/not_found')

module.exports = {
  // @desc:   Show contacts
  // @route   GET /contacts
  showContactList: async (req, res) => {
    try {
      const contactList = await ContactObject.getContactsBy()
      return res.status(200).json(contactList)
    } catch (error) {
      return ErrorHandler.sendErrors(res, error)
    }
  },

  // @desc:   Get contacts by Id
  // @route   GET /contacts/:id
  getContactById: async (req, res) => {
    try {
      const contact = await ContactObject.getOneContactBy({_id: req.params.id})
      if (contact){
        return res.status(200).json(contact)
      }
      // Not found
        return res.status(200).json(null)
    } catch (error) {
      return ErrorHandler.sendErrors(res, error)
    }
  },

  // @desc    Update contacts
  // @route   PUT /contacts/:id
  updateContactById: async (req, res) => {
    try {
      const contact = await ContactObject.getOneContactBy({_id: req.params.id})
      if (contact) {
        const isUpdated = await contact.update({...req.body})
        if (isUpdated) {
          return res.sendStatus(204)
        }

        throw new Error("Failed to update contact.")
      }
      throw new NotFoundError("No contact found.")
    } catch (error) {
      return ErrorHandler.sendErrors(res, error)
    }
  },

  // @desc    Delete contacts
  // @route   DELETE /contacts/:id
  removeContactById: async (req, res) => {
    try {
      const contact = await ContactObject.getOneContactBy({_id: req.params.id})
      if (contact) {
        const isRemoved = await contact.remove()
        if (isRemoved) {
          return res.sendStatus(204)
        }

        throw new Error("Failed to remove contact.")
      }

      throw new NotFoundError("No contact found.")
    } catch (error) {
      return ErrorHandler.sendErrors(res, error)
    }
  },
}
