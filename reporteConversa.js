//////Se genera el reporte de invex de conversaciones
equire("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const bodyParser = require("body-parser");
const request = require("request");
const pm2 = require("pm2");
const db_functions = require("./database_connection/" + process.env.DB);
const training_functions = require("./training/" + process.env.NLP_MODEL);
const db_reporteria_functions = require("./database_connection/" + process.env.DB_REPORTES);
const formatDate = require("./utils/utils.js").formatDate;

db_functions.db_connection();
db_reporteria_functions.db_connection();

//app.post('/api/download/conversaciones', (req, res) => {

var from = req.body.from;
var to = req.body.to;
var fbPageName = req.body.fbPage;

db_reporteria_functions.getConversacionesInRange(from, to, (err, result) => {
	if (err) return res.status(500).send("Something Broke!");

	res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
	res.setHeader("Content-Disposition", "attachment; filename=Reporte.xlsx");
	result.xlsx.write(res).then(function () {
		res.status(200).end();
	});
});
