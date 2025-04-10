import Joi from "joi"

export const signInValidation = Joi.object({
  userName: Joi.string().min(3).required(),
  telegramId: Joi.number().required()
});

export const inviteUser = Joi.object({
  userName: Joi.string().min(3).required(),
  telegramId: Joi.number().required(),
})