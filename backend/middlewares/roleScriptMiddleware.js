// middlewares/roleScriptMiddleware.js

class RoleScriptMiddleware {
    constructor() {
        // Публичные скрипты - доступны без авторизации
        this.publicScripts = [
            '/scripts-js/site/socket.io.js',
            '/scripts-js/site/dashboard-canvas.js',
            '/scripts-js/site/translator.js',
            '/scripts-js/site/universal-routers.js',
            '/scripts-js/site/settings-full.js',
            '/scripts-js/site/profiles.js',
            '/scripts-js/calendare/calendare-libriry.js',
            '/scripts-js/calendare/russian-local.js'
        ];
        
        // Скрипты по ролям
        this.roleScripts = {
            1: [ // Клиент
                '/scripts-js/client/dasboard-client.js',
                '/scripts-js/client/alltickets-client.js',
                '/scripts-js/client/chatai-allroles.js'
            ],
            2: [ // Оператор
                '/scripts-js/operator/dashboard-operator.js'
            ],
            3: [ // Эксперт
                '/scripts-js/expert/dashboard-expert.js',
                '/scripts-js/expert/expert-chat.js',
                '/scripts-js/expert/expert-my-tickets.js'
            ],
            4: [ // Админ
                '/scripts-js/admin/dashboard-admin.js',
                '/scripts-js/admin/admin-users.js',
                '/scripts-js/admin/admin-tickets.js',
                '/scripts-js/admin/admin-chat.js',
                '/scripts-js/admin/admin-ai.js',
                '/scripts-js/admin/admin-logs.js'
            ]
        };
    }
    
    serveScript = (req, res, next) => {
        const requestPath = req.path;
        
        // Проверяем, относится ли запрос к скриптам
        if (!requestPath.startsWith('/scripts-js/')) {
            return next();
        }
        
        // Публичные скрипты - пропускаем без проверки
        if (this.publicScripts.some(script => requestPath === script)) {
            return next();
        }
        
        // Для остальных скриптов нужна авторизация
        const user = req.user;
        
        if (!user || !user.role_id) {
            console.log(`[SECURITY] Unauthorized access to ${requestPath}`);
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        // Проверяем, разрешен ли скрипт для роли пользователя
        const allowedScripts = this.roleScripts[user.role_id] || [];
        const isAllowed = allowedScripts.some(script => requestPath === script);
        
        if (!isAllowed) {
            console.log(`[SECURITY] Access denied: ${requestPath} for role ${user.role_id}`);
            return res.status(403).json({ error: 'Access denied' });
        }
        
        next();
    };
}

module.exports = RoleScriptMiddleware;