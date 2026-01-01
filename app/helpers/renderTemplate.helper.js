exports.renderTemplate = (template, variables) => {
  let result = template;

  for (const key in variables) {
    const regex = new RegExp(`{{${key}}}`, "g");
    result = result.replace(regex, variables[key]);
  }

  return result;
};
