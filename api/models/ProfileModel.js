const mongoose = require('mongoose')

const ProfileSchema = new mongoose.Schema({
    firstName: {
        type: String,
        min: 3,
        max: 30,
    },
    lastName: {
        type: String,
        min: 3,
        max: 30,
    },
    gender: {
        type: String,
        default: 'female',
        enum: ['male','female','lgbt']
    },
    dateOfBirth: {
        type: Date
    },
    phoneNumber: {
        type: String
    },
    avatar: {
        fileName: {
            type: String,
            default: 'default'
        },
        mimeType: {
            type: String,
            enum: ['image/jpeg', 'image/png']
        },
        urlLink: {
            type: String,
            default: null
        }
    },
    status: {
      type: String,
      default: 'activated',
    },
}, {
    timestamps: true
})

module.exports = mongoose.model('Profile', ProfileSchema)