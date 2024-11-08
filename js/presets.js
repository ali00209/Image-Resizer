import { showToast } from './utils.js';
import { elements, state } from './state.js';

class Preset {
    constructor(name, type, width, height, ratio) {
        this.name = name;
        this.type = type; // 'size' or 'ratio'
        this.width = width;
        this.height = height;
        this.ratio = ratio;
        this.timestamp = Date.now();
    }
}

class PresetManager {
    constructor() {
        this.presets = this.loadPresets();
        this.initializeUI();
    }

    loadPresets() {
        const savedPresets = localStorage.getItem('imageResizer_presets');
        return savedPresets ? JSON.parse(savedPresets) : [];
    }

    savePresets() {
        localStorage.setItem('imageResizer_presets', JSON.stringify(this.presets));
    }

    addPreset(name, type, width, height) {
        const ratio = type === 'ratio' ? `${width}:${height}` : null;
        const preset = new Preset(name, type, width, height, ratio);
        this.presets.push(preset);
        this.savePresets();
        this.updatePresetsUI();
        showToast('Preset saved successfully');
    }

    removePreset(index) {
        this.presets.splice(index, 1);
        this.savePresets();
        this.updatePresetsUI();
        showToast('Preset removed');
    }

    initializeUI() {
        // Create presets section in sidebar
        const presetsPanel = document.createElement('div');
        presetsPanel.className = 'settings-panel';
        presetsPanel.id = 'presets';
        presetsPanel.setAttribute('role', 'tabpanel');
        presetsPanel.setAttribute('aria-labelledby', 'presets-tab');
        presetsPanel.setAttribute('aria-hidden', 'true');
        presetsPanel.style.display = 'none';
        presetsPanel.innerHTML = `
            <h3>My Presets</h3>
            <div class="presets-container">
                <div class="add-preset">
                    <input type="text" id="presetName" placeholder="Preset name" aria-label="Preset name">
                    <select id="presetType" aria-label="Preset type">
                        <option value="size">Fixed Size</option>
                        <option value="ratio">Aspect Ratio</option>
                    </select>
                    <button id="savePreset" class="control-button">
                        <i class="ph ph-plus"></i>
                        Save Current
                    </button>
                </div>
                <div class="presets-list" role="list"></div>
            </div>
        `;

        // Add to sidebar menu before the settings content
        const menuSection = document.querySelector('.menu-section');
        const presetsButton = document.createElement('button');
        presetsButton.className = 'menu-item';
        presetsButton.id = 'presets-tab';
        presetsButton.setAttribute('data-target', 'presets');
        presetsButton.setAttribute('role', 'tab');
        presetsButton.setAttribute('aria-selected', 'false');
        presetsButton.setAttribute('aria-controls', 'presets');
        presetsButton.innerHTML = `
            <i class="ph ph-bookmark-simple"></i>
            My Presets
        `;
        menuSection.appendChild(presetsButton);

        // Add panel to settings content
        const settingsContent = document.querySelector('.settings-content');
        settingsContent.appendChild(presetsPanel);

        // Setup event listeners
        this.setupEventListeners();
        this.updatePresetsUI();
    }

    setupEventListeners() {
        const saveButton = document.getElementById('savePreset');
        if (!saveButton) return;

        saveButton.addEventListener('click', () => {
            const name = document.getElementById('presetName').value.trim();
            const type = document.getElementById('presetType').value;
            
            if (!name) {
                showToast('Please enter a preset name', 'error');
                return;
            }

            const width = parseInt(elements.widthInput.value);
            const height = parseInt(elements.heightInput.value);

            if (!width || !height) {
                showToast('Please set dimensions first', 'error');
                return;
            }

            this.addPreset(name, type, width, height);
            document.getElementById('presetName').value = '';
        });
    }

    updatePresetsUI() {
        const presetsList = document.querySelector('.presets-list');
        if (!presetsList) return;
        
        presetsList.innerHTML = '';

        if (this.presets.length === 0) {
            presetsList.innerHTML = `
                <div class="no-presets">
                    <p>No saved presets yet</p>
                </div>
            `;
            return;
        }

        this.presets.forEach((preset, index) => {
            const presetElement = document.createElement('div');
            presetElement.className = 'preset-item';
            presetElement.setAttribute('role', 'listitem');
            presetElement.innerHTML = `
                <div class="preset-info">
                    <span class="preset-name">${preset.name}</span>
                    <span class="preset-details">
                        ${preset.type === 'ratio' 
                            ? `Ratio: ${preset.ratio}`
                            : `Size: ${preset.width}×${preset.height}`}
                    </span>
                </div>
                <div class="preset-actions">
                    <button class="apply-preset" aria-label="Apply preset ${preset.name}">
                        <i class="ph ph-play"></i>
                    </button>
                    <button class="remove-preset" aria-label="Remove preset ${preset.name}">
                        <i class="ph ph-trash"></i>
                    </button>
                </div>
            `;

            // Apply preset
            presetElement.querySelector('.apply-preset').addEventListener('click', () => {
                elements.widthInput.value = preset.width;
                elements.heightInput.value = preset.height;
                if (preset.type === 'ratio') {
                    const currentWidth = parseInt(elements.widthInput.value);
                    const [ratioWidth, ratioHeight] = preset.ratio.split(':').map(Number);
                    const newHeight = Math.round((currentWidth * ratioHeight) / ratioWidth);
                    elements.heightInput.value = newHeight;
                }
                const event = new Event('input');
                elements.widthInput.dispatchEvent(event);
                showToast(`Applied preset: ${preset.name}`);
            });

            // Remove preset
            presetElement.querySelector('.remove-preset').addEventListener('click', () => {
                this.removePreset(index);
            });

            presetsList.appendChild(presetElement);
        });
    }
}

function initializePresets() {
    return new PresetManager();
}

export { initializePresets }; 