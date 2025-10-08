const mongoose = require("mongoose");

const halaqaSchema = new mongoose.Schema({
    name: String,
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }]
});

module.exports = mongoose.model("Halaqa", halaqaSchema);