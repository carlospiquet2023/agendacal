// Gerenciador de Tema
const themeManager = {
    init() {
        this.themeToggle = document.getElementById('toggle-theme');
        this.body = document.body;
        
        // Carrega tema salvo ou usa preferência do sistema
        const savedTheme = localStorage.getItem('theme') || 
            (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        this.setTheme(savedTheme);
        
        // Listener para mudança de tema
        this.themeToggle.addEventListener('click', () => {
            const newTheme = this.body.dataset.theme === 'dark' ? 'light' : 'dark';
            this.setTheme(newTheme);
        });
    },
    
    setTheme(theme) {
        this.body.dataset.theme = theme;
        localStorage.setItem('theme', theme);
        this.themeToggle.querySelector('.theme-icon').textContent = theme === 'dark' ? '🌙' : '☀️';
    }
};

// Gerenciador de Toast
const toastManager = {
    show(message, type = 'info', duration = 3000) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast toast-${type} fade-in`;
        toast.style.display = 'block';
        toast.style.transform = 'translateY(0)';
        toast.style.opacity = '1';

        setTimeout(() => {
            toast.classList.remove('fade-in');
            toast.classList.add('fade-out');
            toast.style.transform = 'translateY(100px)';
            toast.style.opacity = '0';

            setTimeout(() => {
                toast.className = 'toast';
                toast.style.transform = 'translateY(0)';
                toast.style.display = 'none';
                toast.textContent = '';
            }, 300);
        }, duration);
    }
};

// Gerenciador de Eventos
class EventManager {
    constructor() {
        this.events = JSON.parse(localStorage.getItem('eventos')) || [];
        this.trashedEvents = JSON.parse(localStorage.getItem('trashedEvents')) || [];
        this.form = document.getElementById('evento-form');
        this.eventList = document.getElementById('eventos');
        this.trashList = document.getElementById('trash-list');
        this.filterButtons = document.querySelectorAll('.btn-filter');
        this.currentFilter = 'all';
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.renderEvents();
        this.setupFilters();
        this.checkAlarms();
        this.updateTrashCount();
        themeManager.init();
    }
    
    setupEventListeners() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Animação nos inputs
        document.querySelectorAll('.form-input').forEach(input => {
            input.addEventListener('focus', () => {
                input.parentElement.classList.add('focused');
            });
            
            input.addEventListener('blur', () => {
                input.parentElement.classList.remove('focused');
            });
        });
    }
    
    setupFilters() {
        this.filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                this.currentFilter = button.dataset.filter;
                this.renderEvents();
            });
        });
    }
    
    handleSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const evento = {
            id: Date.now(),
            nome: formData.get('nome'),
            titulo: formData.get('titulo'),
            dataHora: formData.get('dataHora'),
            local: formData.get('local'),
            link: formData.get('link'),
            prioridade: formData.get('prioridade'),
            repeticao: formData.get('repeticao'),
            numeroWhatsapp: formData.get('numeroWhatsapp'),
            descricao: formData.get('descricao'),
            concluido: false,
            alertado: false
        };
        
        this.addEvent(evento);
        e.target.reset();
        
        // Rolar suavemente para o topo da seção de eventos
        document.querySelector('.events-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Limpar classes focused e valores dos inputs
        e.target.querySelectorAll('.form-input').forEach(input => {
            input.parentElement.classList.remove('focused');
            input.value = '';
        });
        
        // Resetar select para valores padrão
        e.target.querySelector('#prioridade').value = 'high';
        e.target.querySelector('#repeticao').value = 'none';
        
        toastManager.show('Evento adicionado com sucesso!', 'success');
    }
    
    addEvent(evento) {
        this.events.push(evento);
        this.saveEvents();
        this.renderEvents();
    }
    
    filterEvents() {
        const now = new Date();
        const filteredEvents = (() => {
            switch(this.currentFilter) {
                case 'today':
                    return this.events.filter(event => {
                        const eventDate = new Date(event.dataHora);
                        return eventDate.toDateString() === now.toDateString();
                    });
                    
                case 'week':
                    const weekEnd = new Date(now);
                    weekEnd.setDate(now.getDate() + 7);
                    return this.events.filter(event => {
                        const eventDate = new Date(event.dataHora);
                        return eventDate >= now && eventDate <= weekEnd;
                    });
                    
                case 'month':
                    const monthEnd = new Date(now);
                    monthEnd.setMonth(now.getMonth() + 1);
                    return this.events.filter(event => {
                        const eventDate = new Date(event.dataHora);
                        return eventDate >= now && eventDate <= monthEnd;
                    });
                    
                default:
                    return this.events;
            }
        })();
        
        console.log('Filtro atual:', this.currentFilter);
        console.log('Total de eventos:', this.events.length);
        console.log('Eventos filtrados:', filteredEvents);
        
        return filteredEvents;
    }
    
    renderEvents() {
        const filteredEvents = this.filterEvents();
        this.eventList.innerHTML = '';
        
        filteredEvents.forEach(event => {
            const li = document.createElement('li');
            li.className = `event-item fade-in ${event.concluido ? 'completed' : ''}`;
            li.dataset.priority = event.prioridade;
            const date = new Date(event.dataHora);
            li.innerHTML = `
                <div class="event-header">
                    <h3 class="event-title">${event.titulo}</h3>
                    <span class="event-date">${date.toLocaleString()}</span>
                </div>
                <div class="event-body">
                    ${event.local ? `<p class="event-location">📍 ${event.local}</p>` : ''}
                    ${event.link ? `<a href="${event.link}" target="_blank" class="event-link">🔗 Link</a>` : ''}
                    ${event.descricao ? `<p class="event-description">${event.descricao}</p>` : ''}
                </div>
                <div class="event-actions">
                    <button onclick="exportarPDF('${btoa(JSON.stringify(event))}')" class="btn btn-icon" title="Exportar evento para PDF">
                        📄
                    </button>
                    ${event.numeroWhatsapp ? `
                        <button onclick="eventManager.sendWhatsApp(${event.id})" class="btn btn-icon" title="Enviar lembrete por WhatsApp">
                            📱
                        </button>
                    ` : ''}
                    <button onclick="eventManager.toggleComplete(${event.id})" class="btn btn-icon" title="${event.concluido ? 'Reativar evento' : 'Marcar como concluído'}">
                        ${event.concluido ? '↩️' : '✅'}
                    </button>
                    <button onclick="eventManager.deleteEvent(${event.id})" class="btn btn-icon btn-danger" title="Excluir evento">
                        ❌
                    </button>
                </div>
            `;
            this.eventList.appendChild(li);
        });
    }
    
    toggleComplete(id) {
        const event = this.events.find(e => e.id === id);
        if (event) {
            this.moveToTrash(event);
            this.renderEvents();
            toastManager.show('Evento movido para a lixeira', 'success');
        }
    }
    
    moveToTrash(event) {
        this.events = this.events.filter(e => e.id !== event.id);
        this.trashedEvents.push({...event, trashedDate: new Date()});
        this.saveEvents();
        this.updateTrashCount();
    }
    
    restoreFromTrash(id) {
        const event = this.trashedEvents.find(e => e.id === id);
        if (event) {
            this.trashedEvents = this.trashedEvents.filter(e => e.id !== id);
            delete event.trashedDate;
            this.events.push(event);
            this.saveEvents();
            this.renderTrashList();
            this.renderEvents();
            this.updateTrashCount();
            toastManager.show('Evento restaurado com sucesso!', 'success');
        }
    }
    
    permanentDelete(id) {
        this.trashedEvents = this.trashedEvents.filter(e => e.id !== id);
        this.saveEvents();
        this.renderTrashList();
        this.updateTrashCount();
        toastManager.show('Evento excluído permanentemente', 'error');
    }
    
    openTrash() {
        this.renderTrashList();
        document.getElementById('trash-modal').classList.add('show');
    }
    
    renderTrashList() {
        this.trashList.innerHTML = '';
        
        if (this.trashedEvents.length === 0) {
            this.trashList.innerHTML = '<p class="text-center">A lixeira está vazia</p>';
            return;
        }
        
        this.trashedEvents.forEach(event => {
            const li = document.createElement('li');
            li.className = 'event-item trash-item fade-in';
            li.dataset.priority = event.prioridade;
            
            const date = new Date(event.dataHora);
            const trashedDate = new Date(event.trashedDate);
            
            li.innerHTML = `
                <div class="event-header">
                    <h3 class="event-title">${event.titulo}</h3>
                    <span class="event-date">${date.toLocaleString()}</span>
                </div>
                <div class="event-body">
                    ${event.local ? `<p class="event-location">📍 ${event.local}</p>` : ''}
                    <p class="event-meta">Movido para a lixeira em: ${trashedDate.toLocaleString()}</p>
                    ${event.descricao ? `<p class="event-description">${event.descricao}</p>` : ''}
                </div>
                <div class="trash-actions">
                    <button onclick="eventManager.restoreFromTrash(${event.id})" class="btn btn-icon" title="Restaurar evento">
                        ↩️
                    </button>
                    <button onclick="eventManager.permanentDelete(${event.id})" class="btn btn-icon btn-danger" title="Excluir permanentemente">
                        ❌
                    </button>
                </div>
            `;
            
            this.trashList.appendChild(li);
        });
    }
    
    updateTrashCount() {
        const countElement = document.getElementById('trash-count');
        if (this.trashedEvents.length > 0) {
            countElement.style.display = 'flex';
            countElement.textContent = this.trashedEvents.length;
        } else {
            countElement.style.display = 'none';
        }
    }
    
    deleteEvent(id) {
        this.events = this.events.filter(e => e.id !== id);
        this.saveEvents();
        this.renderEvents();
        toastManager.show('Evento excluído!', 'error');
    }
    
    saveEvents() {
        localStorage.setItem('eventos', JSON.stringify(this.events));
        localStorage.setItem('trashedEvents', JSON.stringify(this.trashedEvents));
    }
    
    sendWhatsApp(id) {
        const evento = this.events.find(e => e.id === id);
        if (!evento) {
            toastManager.show('Evento não encontrado!', 'error');
            return;
        }
        let numero = evento.numeroWhatsapp || '';
        numero = numero.replace(/\D/g, '');
        if (numero.length !== 11) {
            toastManager.show('Número de WhatsApp inválido! Digite DDD + número (11 dígitos)', 'error');
            return;
        }
        const date = new Date(evento.dataHora);
        let message = `🗓️ *Lembrete de Evento - AgendaCal*\n\n`;
        message += `📌 *${evento.titulo}*\n\n`;
        message += `📅 Data: ${date.toLocaleDateString()}\n`;
        message += `⏰ Hora: ${date.toLocaleTimeString()}\n`;
        if (evento.local) message += `📍 Local: ${evento.local}\n`;
        if (evento.link) message += `🔗 Link: ${evento.link}\n`;
        message += `⚡ Prioridade: ${traduzirPrioridade(evento.prioridade)}\n`;
        if (evento.descricao) message += `\n📝 Descrição:\n${evento.descricao}`;
        try {
            const whatsappURL = `https://api.whatsapp.com/send?phone=55${numero}&text=${encodeURIComponent(message)}`;
            window.open(whatsappURL, '_blank');
            toastManager.show('Redirecionando para o WhatsApp...', 'success');
        } catch (error) {
            toastManager.show('Erro ao abrir o WhatsApp. Tente novamente.', 'error');
        }
    }
    
    checkAlarms() {
        setInterval(() => {
            const now = new Date();
            this.events.forEach(event => {
                if (!event.alertado && !event.concluido) {
                    const eventTime = new Date(event.dataHora);
                    if (Math.abs(now - eventTime) < 1000) {
                        this.triggerAlarm(event);
                        event.alertado = true;
                        this.saveEvents();
                    }
                }
            });
        }, 1000);
    }
    
    triggerAlarm(event) {
        document.getElementById('notification').classList.add('active');
        const audio = new Audio('assets/icons/scratch-389.ogg');
        audio.loop = true;
        audio.play().catch(() => {
            toastManager.show('Clique na página para ativar o som', 'warning');
        });
        
        const stopButton = document.getElementById('stopAlarm');
        stopButton.textContent = `🔕 Parar Alarme: ${event.titulo}`;
        stopButton.onclick = () => {
            audio.pause();
            audio.currentTime = 0;
            document.getElementById('notification').classList.remove('active');
        };
    }
}

// Exportação PDF
function exportarPDF(eventoBase64 = null) {
    // Criar elemento temporário para o PDF
    const pdfContainer = document.createElement('div');
    pdfContainer.style.cssText = `
        padding: 0;
        margin: 0;
        background: white;
        font-family: Arial, sans-serif;
        color: black;
    `;
    document.body.appendChild(pdfContainer);
    
    // Adicionar cabeçalho
    const header = document.createElement('div');
    header.innerHTML = `
        <div style="text-align: center; margin: 0 0 20px 0; padding-top: 20px;">
            <h1 style="color: #2196F3; margin: 0 0 10px 0; font-size: 24px;">
                ${eventoBase64 ? 'Detalhes do Evento' : 'Lista de Eventos'} - AgendaCal
            </h1>
            <p style="color: #666; font-size: 14px; margin: 0;">
                Exportado em ${new Date().toLocaleString()}
            </p>
        </div>
    `;
    pdfContainer.appendChild(header);
    
    if (eventoBase64) {
        try {
            // Decodificar e parsear o evento
            const evento = JSON.parse(atob(eventoBase64));
            
            // Exportar evento individual com estilo de tabela
            const table = document.createElement('div');
            table.style.cssText = `
                width: 100%;
                margin-top: 20px;
                background: white;
                border: 1px solid #eee;
                border-radius: 8px;
                overflow: hidden;
            `;
            
            const date = new Date(evento.dataHora);
            
            // Criar linhas da tabela para cada campo
            const campos = [
                ['Título', evento.titulo],
                ['Data/Hora', date.toLocaleString()],
                ['Local', evento.local || '-'],
                ['Prioridade', traduzirPrioridade(evento.prioridade)],
                ['Status', evento.concluido ? 'Concluído' : 'Pendente'],
                ['Repetição', traduzirRepeticao(evento.repeticao)],
                ['Link', evento.link || '-'],
                ['WhatsApp', evento.numeroWhatsapp || '-'],
                ['Descrição', evento.descricao || '-']
            ];
            
            table.innerHTML = `
                <div style="background: #f8f9fa; padding: 15px; border-bottom: 2px solid #eee;">
                    <h2 style="margin: 0; color: #1a73e8; font-size: 18px;">${evento.titulo}</h2>
                </div>
                <div style="padding: 15px;">
                    ${campos.map(([campo, valor]) => `
                        <div style="margin-bottom: 12px;">
                            <strong style="color: #666; display: inline-block; width: 120px;">${campo}:</strong>
                            <span style="color: #333;">${valor}</span>
                        </div>
                    `).join('')}
                </div>
            `;
            
            pdfContainer.appendChild(table);
            
        } catch (error) {
            console.error('Erro ao processar evento:', error);
            toastManager.show('Erro ao gerar PDF do evento', 'error');
            document.body.removeChild(pdfContainer);
            return;
        }
    } else {
        // Criar cards para todos os eventos
        const eventsContainer = document.createElement('div');
        eventsContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 20px;
            padding: 20px 0;
        `;
        
        eventManager.events.forEach(event => {
            const eventCard = document.createElement('div');
            eventCard.style.cssText = `
                background: white;
                border: 1px solid #eee;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                page-break-inside: avoid;
            `;
            
            const date = new Date(event.dataHora);
            const prioridadeCores = {
                'high': '#f44336',
                'medium': '#ffc107',
                'low': '#4caf50'
            };
            
            eventCard.innerHTML = `
                <div style="
                    border-left: 4px solid ${prioridadeCores[event.prioridade]};
                    padding: 15px;
                ">
                    <div style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 10px;
                    ">
                        <h3 style="
                            margin: 0;
                            color: #1a73e8;
                            font-size: 18px;
                        ">${event.titulo}</h3>
                        <span style="
                            color: #666;
                            font-size: 14px;
                        ">${date.toLocaleString()}</span>
                    </div>
                    
                    <div style="margin: 15px 0;">
                        ${event.local ? `
                            <p style="margin: 5px 0; color: #666;">
                                <strong>Local:</strong> ${event.local}
                            </p>
                        ` : ''}
                        
                        <p style="margin: 5px 0; color: #666;">
                            <strong>Prioridade:</strong> ${traduzirPrioridade(event.prioridade)}
                        </p>
                        
                        <p style="margin: 5px 0; color: #666;">
                            <strong>Status:</strong> ${event.concluido ? 'Concluído' : 'Pendente'}
                        </p>
                        
                        ${event.link ? `
                            <p style="margin: 5px 0; color: #666;">
                                <strong>Link:</strong> ${event.link}
                            </p>
                        ` : ''}
                        
                        ${event.numeroWhatsapp ? `
                            <p style="margin: 5px 0; color: #666;">
                                <strong>WhatsApp:</strong> ${event.numeroWhatsapp}
                            </p>
                        ` : ''}
                        
                        ${event.descricao ? `
                            <div style="
                                margin-top: 10px;
                                padding-top: 10px;
                                border-top: 1px solid #eee;
                            ">
                                <strong style="color: #666;">Descrição:</strong>
                                <p style="
                                    margin: 5px 0;
                                    color: #333;
                                    white-space: pre-wrap;
                                ">${event.descricao}</p>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
            
            eventsContainer.appendChild(eventCard);
        });
        
        pdfContainer.appendChild(eventsContainer);
    }

    // Configurações do PDF
    const opt = {
        margin: [10, 10],
        filename: eventoBase64 ? 
            `evento_${new Date().toLocaleDateString().replace(/\//g, '_')}.pdf` :
            `eventos_${new Date().toLocaleDateString().replace(/\//g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2,
            useCORS: true,
            letterRendering: true,
            scrollY: 0
        },
        jsPDF: { 
            unit: 'mm', 
            format: 'a4',
            orientation: 'portrait',
            putTotalPages: true,
            enableLinks: true
        },
        pagebreak: { 
            mode: ['avoid-all', 'css', 'legacy'],
            before: '.page-break-before',
            after: '.page-break-after',
            avoid: ['tr', '.event-item']
        }
    };

    // Gerar PDF
    html2pdf()
        .set(opt)
        .from(pdfContainer)
        .save()
        .then(() => {
            document.body.removeChild(pdfContainer);
            toastManager.show('PDF exportado com sucesso!', 'success');
        })
        .catch(err => {
            console.error('Erro ao gerar PDF:', err);
            document.body.removeChild(pdfContainer);
            toastManager.show('Erro ao exportar PDF', 'error');
        });
}

// Funções auxiliares para tradução
function traduzirPrioridade(prioridade) {
    const traducoes = {
        'high': 'Alta',
        'medium': 'Média',
        'low': 'Baixa'
    };
    return traducoes[prioridade] || prioridade;
}

function traduzirRepeticao(repeticao) {
    const traducoes = {
        'none': 'Não repetir',
        'daily': 'Diariamente',
        'weekly': 'Semanalmente',
        'monthly': 'Mensalmente'
    };
    return traducoes[repeticao] || repeticao;
}

// Backup e Restauração
function fazerBackup() {
    const data = JSON.stringify(eventManager.events);
    const blob = new Blob([data], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `backup_eventos_${new Date().toLocaleDateString()}.json`;
    link.click();
    toastManager.show('Backup criado com sucesso!', 'success');
}

function importarBackup() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = () => {
            try {
                eventManager.events = JSON.parse(reader.result);
                eventManager.saveEvents();
                eventManager.renderEvents();
                toastManager.show('Backup restaurado com sucesso!', 'success');
            } catch (error) {
                toastManager.show('Erro ao restaurar backup!', 'error');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// Inicialização
const eventManager = new EventManager();
