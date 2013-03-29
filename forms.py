from flaskext.wtf import Form, TextField, Required, PasswordField, validators, SelectField, EqualTo
from flask import Flask, session

class RegisterForm(Form):
	password = PasswordField('Password', validators=[Required(), EqualTo('confirm', message='Passwords must match')])
	confirm = PasswordField('Repeat Password')
	