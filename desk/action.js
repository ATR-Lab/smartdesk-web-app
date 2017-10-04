var deskAction = {};

deskAction.status = {};
deskAction.status.EXECUTE    = 'EXECUTE';
deskAction.status.EXECUTING  = 'EXECUTING';
deskAction.status.COMPLETED  = 'COMPLETED';

deskAction.command = {};
deskAction.command.LOWER     = 'LOWER';
deskAction.command.RAISE     = 'RAISE';

deskAction.type = {};
deskAction.type.NUMERIC      = 'QUANTITATIVE';
deskAction.type.DISCRETE     = 'QUALITATIVE';

module.exports = deskAction;