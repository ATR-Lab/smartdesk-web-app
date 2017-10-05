var deskAction = {};

deskAction.status = {};
deskAction.status.EXECUTE    = 'EXECUTE';
deskAction.status.EXECUTING  = 'EXECUTING';
deskAction.status.COMPLETED  = 'COMPLETED';
deskAction.status.RESET      = 'RESET';

deskAction.command = {};
deskAction.command.LOWER     = 'LOWER';
deskAction.command.RAISE     = 'RAISE';
deskAction.command.IDLE      = 'IDLE';
deskAction.command.value        = {};
deskAction.command.value.SMALL  = 'SMALL';
deskAction.command.value.LARGE  = 'LARGE';
deskAction.command.value.TOP    = 'TOP';
deskAction.command.value.MIDDLE = 'MIDDLE';
deskAction.command.value.BOTTOM = 'BOTTOM';

deskAction.type = {};
deskAction.type.NUMERIC      = 'QUANTITATIVE';
deskAction.type.DISCRETE     = 'QUALITATIVE';

module.exports = deskAction;