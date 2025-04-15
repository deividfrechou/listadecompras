document.addEventListener('DOMContentLoaded', function() {
    // Elementos DOM
    const voiceButton = document.getElementById('voiceButton');
    const voiceStatus = document.getElementById('voiceStatus');
    const itemInput = document.getElementById('itemInput');
    const addItemBtn = document.getElementById('addItemBtn');
    const shoppingList = document.getElementById('shoppingList');
    const totalAmount = document.getElementById('totalAmount');
    const itemModal = document.getElementById('itemModal');
    const closeModal = document.querySelector('.close-modal');
    const editItemName = document.getElementById('editItemName');
    const editItemPrice = document.getElementById('editItemPrice');
    const saveItemBtn = document.getElementById('saveItemBtn');
    
    // Verificar suporte a reconhecimento de voz
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;
    let isRecording = false;
    let editingItemId = null;
    let items = [];
    
    // Inicializar reconhecimento de voz se suportado
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.lang = 'pt-BR';
        recognition.continuous = false;
        recognition.interimResults = true;
        
        recognition.onstart = function() {
            isRecording = true;
            voiceStatus.textContent = 'Ouvindo...';
            voiceButton.innerHTML = '<i class="fas fa-microphone-slash"></i><span>Solte para parar</span>';
            voiceButton.classList.add('recording');
        };
        
        recognition.onresult = function(event) {
            const result = event.results[0][0].transcript;
            itemInput.textContent = result;
        };
        
        recognition.onend = function() {
            isRecording = false;
            voiceStatus.textContent = 'Pronto para ouvir';
            voiceButton.innerHTML = '<i class="fas fa-microphone"></i><span>Pressione para falar</span>';
            voiceButton.classList.remove('recording');
        };
        
        recognition.onerror = function(event) {
            voiceStatus.textContent = 'Erro: ' + event.error;
            isRecording = false;
            voiceButton.innerHTML = '<i class="fas fa-microphone"></i><span>Pressione para falar</span>';
            voiceButton.classList.remove('recording');
        };
    } else {
        voiceButton.disabled = true;
        voiceStatus.textContent = 'Reconhecimento de voz não suportado neste navegador';
    }
    
    // Event Listeners
    voiceButton.addEventListener('mousedown', function() {
        if (SpeechRecognition && !isRecording) {
            recognition.start();
        }
    });
    
    voiceButton.addEventListener('mouseup', function() {
        if (SpeechRecognition && isRecording) {
            recognition.stop();
        }
    });
    
    voiceButton.addEventListener('touchstart', function(e) {
        e.preventDefault();
        if (SpeechRecognition && !isRecording) {
            recognition.start();
        }
    });
    
    voiceButton.addEventListener('touchend', function(e) {
        e.preventDefault();
        if (SpeechRecognition && isRecording) {
            recognition.stop();
        }
    });
    
    addItemBtn.addEventListener('click', addItem);
    
    closeModal.addEventListener('click', function() {
        itemModal.style.display = 'none';
    });
    
    saveItemBtn.addEventListener('click', saveItemChanges);
    
    // Funções
    function addItem() {
        const itemName = itemInput.textContent.trim();
        if (itemName === '' || itemName === 'O que deseja adicionar?') {
            return;
        }
        
        const itemId = generateId();
        const newItem = {
            id: itemId,
            name: itemName,
            price: 0,
            completed: false
        };
        
        items.push(newItem);
        renderItem(newItem);
        updateTotal();
        
        // Resetar o input
        itemInput.textContent = 'O que deseja adicionar?';
    }
    
    function renderItem(item) {
        const listItem = document.createElement('li');
        listItem.className = 'list-item';
        listItem.setAttribute('data-id', item.id);
        
        if (item.completed) {
            listItem.classList.add('completed');
        }
        
        listItem.innerHTML = `
            <div class="item-info">
                <div class="item-name">${item.name}</div>
                <div class="item-price">R$ ${item.price.toFixed(2)}</div>
            </div>
            <div class="item-actions">
                <button class="action-btn edit-btn" title="Editar item">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn price-btn" title="Editar preço">
                    <i class="fas fa-tag"></i>
                </button>
                <button class="action-btn delete-btn" title="Excluir item">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        // Evento para marcar como concluído
        listItem.addEventListener('click', function(e) {
            if (!e.target.closest('.action-btn')) {
                toggleCompleteItem(item.id);
            }
        });
        
        // Eventos para os botões
        const editBtn = listItem.querySelector('.edit-btn');
        const priceBtn = listItem.querySelector('.price-btn');
        const deleteBtn = listItem.querySelector('.delete-btn');
        
        editBtn.addEventListener('click', function() {
            openEditModal(item.id, true);
        });
        
        priceBtn.addEventListener('click', function() {
            openEditModal(item.id, false);
        });
        
        deleteBtn.addEventListener('click', function() {
            deleteItem(item.id);
        });
        
        shoppingList.appendChild(listItem);
    }
    
    function toggleCompleteItem(id) {
        const index = items.findIndex(item => item.id === id);
        if (index !== -1) {
            items[index].completed = !items[index].completed;
            
            const listItem = document.querySelector(`.list-item[data-id="${id}"]`);
            if (listItem) {
                if (items[index].completed) {
                    listItem.classList.add('completed');
                } else {
                    listItem.classList.remove('completed');
                }
            }
        }
    }
    
    function openEditModal(id, editName) {
        const item = items.find(item => item.id === id);
        if (!item) return;
        
        editingItemId = id;
        editItemName.value = item.name;
        editItemPrice.value = item.price;
        
        if (editName) {
            editItemName.focus();
        } else {
            editItemPrice.focus();
        }
        
        itemModal.style.display = 'flex';
    }
    
    function saveItemChanges() {
        if (!editingItemId) return;
        
        const name = editItemName.value.trim();
        const price = parseFloat(editItemPrice.value) || 0;
        
        if (name === '') return;
        
        const index = items.findIndex(item => item.id === editingItemId);
        if (index !== -1) {
            items[index].name = name;
            items[index].price = price;
            
            const listItem = document.querySelector(`.list-item[data-id="${editingItemId}"]`);
            if (listItem) {
                const nameElement = listItem.querySelector('.item-name');
                const priceElement = listItem.querySelector('.item-price');
                
                nameElement.textContent = name;
                priceElement.textContent = `R$ ${price.toFixed(2)}`;
            }
            
            updateTotal();
        }
        
        itemModal.style.display = 'none';
        editingItemId = null;
    }
    
    function deleteItem(id) {
        const index = items.findIndex(item => item.id === id);
        if (index !== -1) {
            items.splice(index, 1);
            
            const listItem = document.querySelector(`.list-item[data-id="${id}"]`);
            if (listItem) {
                listItem.remove();
            }
            
            updateTotal();
        }
    }
    
    function updateTotal() {
        const total = items.reduce((sum, item) => sum + item.price, 0);
        totalAmount.textContent = `R$ ${total.toFixed(2)}`;
    }
    
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    // Inicialização
    window.addEventListener('click', function(e) {
        if (e.target === itemModal) {
            itemModal.style.display = 'none';
        }
    });
});
