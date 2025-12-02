const ERRORES = {
    "E1": "E1: Error, se esperaba espacio en blanco", 
    "E2": "E2: Error, se esperaba carácter",           
    "E3": "E3: Error, se esperaba carácter abierto",   
    "E4": "E4: Error, se esperaba carácter de cierre", 
    "E5": "E5: Error, se esperaba carácter de inicio de sesion", 
    "E6": "E6: Error de sintaxis"                      
};

const REGLAS_SINTAXIS = {
    "REGISTER": ["REGISTER", "{", "s", "=", "start", "}", ";"],
    "CREATE_ACCOUNT": ["CREATE_ACCOUNT", "{", "k", "=", "new", "}", ";"],
    "LOGIN": ["LOGIN", "{", "s", "=", "start", "}", ";"],
    "INPUT_EMAIL": ["INPUT_EMAIL", "[", "email", "=", "w", "]", ";"],
    "CHECK_EMAIL": ["CHECK_EMAIL", "(", "status", "=", "VALID", ")", ";"],
    "ERROR_EMAIL": ["ERROR_EMAIL", "(", "status", "=", "INVALID", ")", ";"],
    "INPUT_NAME": ["INPUT_NAME", "[", "name", "=", "w", "]", ";"],
    "CHECK_NAME": ["CHECK_NAME", "(", "status", "=", "VALID", ")", ";"],
    "ERROR_NAME": ["ERROR_NAME", "(", "status", "=", "INVALID", ")", ";"],
    "INPUT_BIRTH_DAY": ["INPUT_BIRTH_DAY", "[", "age", "=", "w", "]", ";"],
    "CHECK_AGE": ["CHECK_AGE", "(", "age", ">", "18", ")", ";"],
    "ERROR_UNDERAGE": ["ERROR_UNDERAGE", "(", "age", "<", "18", ")", ";"],
    "INPUT_PASS": ["INPUT_PASS", "[", "pass", "=", "w", "]", ";"],
    "INPUT_PASSAGAIN": ["INPUT_PASSAGAIN", "[", "pass", "=", "w", "]", ";"],
    "CHECK_PASS": ["CHECK_PASS", "(", "status", "=", "VALID", ")", ";"],
    "ERROR_PASS": ["ERROR_PASS", "(", "status", "=", "INVALID", ")", ";"],
    "SHOW_CAPTCHA": ["SHOW_CAPTCHA", "[", "captcha", "=", "w", "]", ";"],
    "CHECK_CAPTCHA": ["CHECK_CAPTCHA", "(", "status", "=", "VALID", ")", ";"],
    "ERROR_CAPTCHA": ["ERROR_CAPTCHA", "(", "status", "=", "INVALID", ")", ";"],
    "REGISTER_SUCCESS": ["REGISTER_SUCCESS", "{", "s", "=", "end", "}", ";"],
    "CREATE_ANOTHER_ACCOUNT": ["CREATE_ANOTHER_ACCOUNT", "{", "k", "=", "new", "}", ";"],
    "FINISH": ["FINISH", "{", "s", "=", "finish", "}", ";"]
};

const TRANSICIONES = {
    "START": ["REGISTER"], 
    "REGISTER": ["CREATE_ACCOUNT", "LOGIN"],
    "CREATE_ACCOUNT": ["INPUT_EMAIL"],
    "LOGIN": ["FINISH", "LOGIN"],
    "INPUT_EMAIL": ["CHECK_EMAIL"],
    "CHECK_EMAIL": ["INPUT_NAME", "ERROR_EMAIL", "FINISH", "CREATE_ACCOUNT"],
    "ERROR_EMAIL": ["INPUT_EMAIL"],
    "INPUT_NAME": ["CHECK_NAME"],
    "CHECK_NAME": ["INPUT_BIRTH_DAY", "ERROR_NAME"],
    "ERROR_NAME": ["INPUT_NAME"],
    "INPUT_BIRTH_DAY": ["CHECK_AGE"],
    "CHECK_AGE": ["INPUT_PASS", "ERROR_UNDERAGE"],
    "ERROR_UNDERAGE": ["INPUT_BIRTH_DAY"],
    "INPUT_PASS": ["INPUT_PASSAGAIN", "INPUT_PASS", "CHECK_PASS"],
    "INPUT_PASSAGAIN": ["CHECK_PASS"],
    "CHECK_PASS": ["SHOW_CAPTCHA", "ERROR_PASS"],
    "ERROR_PASS": ["INPUT_PASS"],
    "SHOW_CAPTCHA": ["CHECK_CAPTCHA"],
    "CHECK_CAPTCHA": ["REGISTER_SUCCESS", "ERROR_CAPTCHA"],
    "ERROR_CAPTCHA": ["SHOW_CAPTCHA"],
    "REGISTER_SUCCESS": ["CREATE_ANOTHER_ACCOUNT", "FINISH"],
    "CREATE_ANOTHER_ACCOUNT": ["FINISH", "CREATE_ACCOUNT", "LOGIN"], 
    "FINISH": []
};

function tokenize(codigoFuente) {
    const tokens = [];
    let tokenActual = "";
    const separadores = new Set(['{', '}', '[', ']', '(', ')', ';', '=', '>', '<']);
    
    for (let i = 0; i < codigoFuente.length; i++) {
        const char = codigoFuente[i];
        if (/\s/.test(char)) {
            if (tokenActual) { tokens.push(tokenActual); tokenActual = ""; }
        } else if (separadores.has(char)) {
            if (tokenActual) { tokens.push(tokenActual); tokenActual = ""; }
            tokens.push(char);
        } else {
            tokenActual += char;
        }
    }
    if (tokenActual) tokens.push(tokenActual);
    return tokens;
}

function identificarInstrucciones(tokens) {
    const instruccionesDetectadas = [];
    let k = 0;
    while (k < tokens.length) {
        const tokenActual = tokens[k];
        if (!REGLAS_SINTAXIS[tokenActual]) throw new Error(`${ERRORES['E6']} (Token desconocido: '${tokenActual}')`);
        const regla = REGLAS_SINTAXIS[tokenActual];
        if (k + regla.length > tokens.length) throw new Error("INCOMPLETO");
        for (let j = 0; j < regla.length; j++) {
            const esperado = regla[j];
            const encontrado = tokens[k + j];
            if (encontrado !== esperado) {
                if (['{', '[', '('].includes(esperado)) throw new Error(`${ERRORES['E3']} (Se esperaba '${esperado}' pero se encontró '${encontrado}')`);
                else if (['}', ']', ')'].includes(esperado)) throw new Error(`${ERRORES['E4']} (Se esperaba '${esperado}' pero se encontró '${encontrado}')`);
                else throw new Error(`${ERRORES['E2']} (Se esperaba '${esperado}' pero se encontró '${encontrado}')`);
            }
        }
        instruccionesDetectadas.push(tokenActual);
        k += regla.length;
    }
    return instruccionesDetectadas;
}

function validarFlujo(listaInstrucciones) {
    let estadoActual = "START";
    for (const instr of listaInstrucciones) {
        const transicionesPosibles = TRANSICIONES[estadoActual] || [];
        if (transicionesPosibles.includes(instr)) {
            estadoActual = instr;
        } else {
            if (estadoActual === "START") throw new Error(`${ERRORES['E5']} (Se debe iniciar con REGISTER)`);
            throw new Error(`${ERRORES['E6']} (Flujo inválido: No se puede ir a '${instr}' desde '${estadoActual}')`);
        }
    }
    if (estadoActual !== "FINISH") throw new Error(`INCOMPLETO_FINISH: El proceso va bien, pero debe terminar en 'FINISH'.`);
}

const codeInput = document.getElementById('codeInput');
const statusBox = document.getElementById('status-box');

codeInput.addEventListener('input', () => {
    const codigo = codeInput.value;
    if (!codigo.trim()) {
        statusBox.textContent = "Esperando entrada...";
        statusBox.className = "status-idle";
        return;
    }
    try {
        const tokens = tokenize(codigo);
        const instrucciones = identificarInstrucciones(tokens);
        validarFlujo(instrucciones);
        statusBox.textContent = ">>> RESULTADO: CADENA VÁLIDA <<<";
        statusBox.className = "status-valid";
    } catch (e) {
        const msg = e.message;
        if (msg === "INCOMPLETO") {
            statusBox.textContent = "Escribiendo instrucción... (Completa la línea)";
            statusBox.className = "status-incomplete";
        } else if (msg.startsWith("INCOMPLETO_FINISH")) {
            statusBox.textContent = "Cadena en progreso... (Aún no llegas a FINISH)\n" + msg.split(":")[1];
            statusBox.className = "status-incomplete";
        } else {
            statusBox.textContent = msg;
            statusBox.className = "status-error";
        }
    }
});
