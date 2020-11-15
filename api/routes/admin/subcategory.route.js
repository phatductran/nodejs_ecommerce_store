const express = require('express')
const router = express.Router()
const { showSubcategoriesByCategoryId, getSubcategoryById, createNewSubcategory, updateSubcategoryById, removeSubcategoryById} 
    = require('../../controllers/subcategory.controller')

// @desc    Get subcategory list
// @route   GET /subcategories/:categoryId
router.get('/', showSubcategoriesByCategoryId)

// @desc    Get a subcategory
// @route   GET /subcategories/:id
router.get('/:id', getSubcategoryById)

// @desc    Add new subcategory
// @route   POST /subcategories
router.post('/', createNewSubcategory)

// @desc    Update subcategory
// @route   PUT /subcategories/:id/subcategories/:subcategoryId
router.put('/:id', updateSubcategoryById)

// @desc    Delete subcategory
// @route   PUT /subcategories/:id
router.delete('/:id', removeSubcategoryById)

module.exports = router