// Criar partículas flutuantes
function createParticles() {
    const particlesContainer = document.getElementById('particles-container');
    
    for (let i = 0; i < 25; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        const size = Math.random() * 8 + 4;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        
        particle.style.animationDuration = `${Math.random() * 20 + 10}s`;
        particle.style.animationDelay = `${Math.random() * 5}s`;
        
        // Cor aleatória para partículas
        const colors = [
            'rgba(255, 255, 255, 0.3)',
            'rgba(255, 255, 255, 0.4)',
            'rgba(255, 255, 255, 0.2)',
            'rgba(255, 255, 255, 0.5)'
        ];
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
        
        particlesContainer.appendChild(particle);
    }
}

// Validar formulário
function validateForm(username, password) {
    const errors = [];
    
    if (!username.trim()) {
        errors.push('Usuário é obrigatório');
    }
    
    if (!password.trim()) {
        errors.push('Senha é obrigatória');
    } else if (password.length < 6) {
        errors.push('Senha deve ter pelo menos 6 caracteres');
    }
    
    return errors;
}

// Mostrar mensagem de erro
function showError(message) {
    // Remove mensagens de erro anteriores
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    
    const form = document.getElementById('loginForm');
    form.appendChild(errorElement);
    
    // Remove a mensagem após 5 segundos
    setTimeout(() => {
        if (errorElement.parentNode) {
            errorElement.remove();
        }
    }, 5000);
}

// Simular autenticação
function authenticate(username, password) {
    // Aqui você faria uma requisição para o servidor
    // Esta é uma simulação com credenciais fixas
    const validUsers = {
        'admin': 'admin123',
        'user': 'user123',
        'gestor': 'gestor123'
    };
    
    return validUsers[username] === password;
}

// Efeito de digitação no placeholder
function typeWriterEffect() {
    const placeholders = [
        "Digite seu usuário...",
        "Entre com seu email...",
        "Informe seu login..."
    ];
    
    const passwordPlaceholders = [
        "Digite sua senha...",
        "Sua senha secreta...",
        "Senha de acesso..."
    ];
    
    let userIndex = 0;
    let passIndex = 0;
    let userCharIndex = 0;
    let passCharIndex = 0;
    let userDeleting = false;
    let passDeleting = false;
    
    const userInput = document.getElementById('username');
    const passInput = document.getElementById('password');
    
    function typeUser() {
        const current = placeholders[userIndex];
        
        if (userDeleting) {
            userInput.placeholder = current.substring(0, userCharIndex - 1);
            userCharIndex--;
        } else {
            userInput.placeholder = current.substring(0, userCharIndex + 1);
            userCharIndex++;
        }
        
        if (!userDeleting && userCharIndex === current.length) {
            userDeleting = true;
            setTimeout(typeUser, 1000);
        } else if (userDeleting && userCharIndex === 0) {
            userDeleting = false;
            userIndex = (userIndex + 1) % placeholders.length;
            setTimeout(typeUser, 500);
        } else {
            setTimeout(typeUser, userDeleting ? 50 : 100);
        }
    }
    
    function typePass() {
        const current = passwordPlaceholders[passIndex];
        
        if (passDeleting) {
            passInput.placeholder = current.substring(0, passCharIndex - 1);
            passCharIndex--;
        } else {
            passInput.placeholder = current.substring(0, passCharIndex + 1);
            passCharIndex++;
        }
        
        if (!passDeleting && passCharIndex === current.length) {
            passDeleting = true;
            setTimeout(typePass, 1000);
        } else if (passDeleting && passCharIndex === 0) {
            passDeleting = false;
            passIndex = (passIndex + 1) % passwordPlaceholders.length;
            setTimeout(typePass, 500);
        } else {
            setTimeout(typePass, passDeleting ? 50 : 100);
        }
    }
    
    // Iniciar efeitos
    setTimeout(typeUser, 1000);
    setTimeout(typePass, 1500);
}

// Manipular envio do formulário
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const submitBtn = document.getElementById('submitBtn');
    const remember = document.getElementById('remember').checked;
    
    // Validar campos
    const errors = validateForm(username, password);
    if (errors.length > 0) {
        showError(errors[0]);
        return;
    }
    
    // Efeito de loading
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
    submitBtn.disabled = true;
    
    // Simular tempo de verificação
    setTimeout(() => {
        if (authenticate(username, password)) {
            // Login bem-sucedido
            submitBtn.innerHTML = '<i class="fas fa-check"></i> Login realizado!';
            submitBtn.style.background = '#4CAF50';
            submitBtn.style.color = 'white';
            
            // Salvar no localStorage se "Lembrar-me" estiver marcado
            if (remember) {
                localStorage.setItem('adminUsername', username);
                localStorage.setItem('adminRemember', 'true');
            } else {
                localStorage.removeItem('adminUsername');
                localStorage.removeItem('adminRemember');
            }
            
            // Efeito visual de sucesso
            document.querySelector('.login-container').style.background = 'rgba(76, 175, 80, 0.2)';
            
            // Redirecionar após sucesso
            setTimeout(() => {
                alert(`Bem-vindo, ${username}! Redirecionando para o painel...`);
                // window.location.href = 'admin.html';
            }, 1500);
            
        } else {
            // Login falhou
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            showError('Usuário ou senha incorretos!');
            
            // Efeito de shake no formulário
            const container = document.querySelector('.login-container');
            container.style.animation = 'shake 0.5s ease';
            container.style.background = 'rgba(255, 107, 107, 0.2)';
            
            setTimeout(() => {
                container.style.animation = '';
                container.style.background = 'rgba(255, 255, 255, 0.1)';
            }, 500);
        }
    }, 2000);
});

// Preencher usuário salvo se existir
document.addEventListener('DOMContentLoaded', function() {
    createParticles();
    typeWriterEffect();
    
    const savedUsername = localStorage.getItem('adminUsername');
    const savedRemember = localStorage.getItem('adminRemember');
    
    if (savedUsername && savedRemember === 'true') {
        document.getElementById('username').value = savedUsername;
        document.getElementById('remember').checked = true;
    }
    
    // Focar no campo de usuário
    document.getElementById('username').focus();
    
    // Efeitos adicionais nos inputs
    document.querySelectorAll('.input-group input').forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.style.transform = 'scale(1.02)';
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.style.transform = 'scale(1)';
        });
    });
    
    // Efeito de digitação automática para demonstração
    setTimeout(() => {
        if (!document.getElementById('username').value) {
            document.getElementById('username').value = 'admin';
            setTimeout(() => {
                document.getElementById('password').value = 'admin123';
            }, 500);
        }
    }, 2000);
});