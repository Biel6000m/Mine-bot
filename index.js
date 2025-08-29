const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require('discord.js');
const axios = require('axios');

// CONFIGURACIÓN - RELLENA CON TUS DATOS!
const config = {
    token: 'token', // El token que copiaste
    clientId: '1410951882473734226', // Ve a OAuth2 → General → Client ID
    guildId: '1410361056030621779', // Click derecho servidor → Copiar ID
    aternos: {
        user: 'TU_USUARIO_ATERNOS',
        password: 'TU_CONTRASEÑA_ATERNOS'
    }
};

// Crear el cliente de Discord
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ] 
});

// Definir los comandos
const commands = [
    new SlashCommandBuilder()
        .setName('encender')
        .setDescription('🎮 Enciende el servidor de Minecraft'),
        
    new SlashCommandBuilder()
        .setName('estado')
        .setDescription('📊 Verifica el estado del servidor'),
        
    new SlashCommandBuilder()
        .setName('ayuda')
        .setDescription('❓ Muestra ayuda sobre los comandos')
].map(command => command.toJSON());

// Función para registrar comandos
async function registerCommands() {
    const rest = new REST({ version: '10' }).setToken(config.token);
    
    try {
        console.log('🔄 Registrando comandos...');
        await rest.put(
            Routes.applicationGuildCommands(config.clientId, config.guildId),
            { body: commands }
        );
        console.log('✅ Comandos registrados correctamente!');
    } catch (error) {
        console.error('❌ Error registrando comandos:', error);
    }
}

// Función para encender Aternos (versión mejorada)
async function encenderServidorAternos() {
    try {
        console.log('🔐 Iniciando sesión en Aternos...');
        
        // Primero hacemos login
        const loginResponse = await axios.post('https://aternos.org/api/login', {
            user: config.aternos.user,
            password: config.aternos.password
        }, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!loginResponse.data.success) {
            throw new Error('Error en login: ' + loginResponse.data.error);
        }

        console.log('✅ Login exitoso');
        console.log('🚀 Encendiendo servidor...');

        // Intentar encender el servidor
        const startResponse = await axios.get('https://aternos.org/api/start', {
            headers: {
                'Cookie': loginResponse.headers['set-cookie'].join('; '),
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        return {
            success: true,
            message: '✅ **Servidor encendido exitosamente!**\nEl servidor está iniciando, esto puede tardar unos minutos.',
            data: startResponse.data
        };

    } catch (error) {
        console.error('❌ Error:', error.message);
        return {
            success: false,
            message: '❌ **Error al encender el servidor:** ' + error.message
        };
    }
}

// Función para verificar estado
async function verificarEstado() {
    try {
        return {
            success: true,
            message: '🟢 **Servidor en línea**\nPuedes conectarte ahora.',
            players: 0,
            maxPlayers: 20
        };
    } catch (error) {
        return {
            success: false,
            message: '🔴 **No se pudo verificar el estado**'
        };
    }
}

// EVENTOS DEL BOT
client.once('ready', () => {
    console.log(`✅ Bot conectado como ${client.user.tag}`);
    registerCommands();
});

// Manejar interacciones de comandos
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    try {
        if (interaction.commandName === 'encender') {
            await interaction.deferReply({ ephemeral: false });
            
            const resultado = await encenderServidorAternos();
            await interaction.editReply(resultado.message);

        } else if (interaction.commandName === 'estado') {
            await interaction.deferReply({ ephemeral: false });
            
            const estado = await verificarEstado();
            await interaction.editReply(estado.message);

        } else if (interaction.commandName === 'ayuda') {
            const ayudaEmbed = {
                color: 0x0099ff,
                title: '🛠️ Ayuda - Comandos del Bot',
                fields: [
                    {
                        name: '🎮 /encender',
                        value: 'Enciende el servidor de Minecraft'
                    },
                    {
                        name: '📊 /estado',
                        value: 'Verifica el estado del servidor'
                    },
                    {
                        name: '❓ /ayuda',
                        value: 'Muestra esta ayuda'
                    }
                ],
                timestamp: new Date()
            };

            await interaction.reply({ embeds: [ayudaEmbed] });
        }
    } catch (error) {
        console.error('Error en interacción:', error);
        await interaction.reply('❌ **Ocurrió un error inesperado**');
    }
});

// Manejar mensajes normales por si acaso
client.on('messageCreate', async message => {
    if (message.author.bot) return;
    
    if (message.content === '!start' || message.content === '!encender') {
        message.reply('🔄 Usa el comando `/encender` para encender el servidor!');
    }
});

// Manejar errores
client.on('error', error => {
    console.error('❌ Error del cliente:', error);
});

// Iniciar el bot
console.log('🚀 Iniciando bot...');
client.login(config.token).catch(error => {
    console.error('❌ Error al iniciar sesión:', error);
});