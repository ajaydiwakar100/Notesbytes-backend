const db = require("../../../models");
const AdminUser = db.AdminUser;
const GlobalSetting = db.GlobalSetting;

const globalSettingHelper = {
  
    getAllSettingList: async () => { 
        const gobalSettings = await GlobalSetting.find({}).lean();
        return gobalSettings;
    },
}
module.exports = globalSettingHelper;