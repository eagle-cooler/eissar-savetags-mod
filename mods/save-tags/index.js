const fs = require('fs');
const path = require('path');

function saveDataToFile(filePath, data) {
    fs.writeFile(filePath, data, (err) => {
        if (err) {
            console.error('Could not save file:', err);
            eagle.notification.show('error', `Failed to save tags: ${err.message}`);
        } else {
            eagle.notification.show('success', 'Tags saved successfully');
        }
    });
}

async function showDirectoryPickerDialog() {
    const options = {
        title: 'Select Save Location',
        properties: ['openDirectory'],
    };
    try {
        const result = await eagle.dialog.showOpenDialog(options);
        return result.canceled ? null : result.filePaths[0];
    } catch (err) {
        console.error('Error selecting directory:', err);
        eagle.notification.show('error', 'Failed to open directory picker');
        return null;
    }
}

async function SaveTags(format) {
    function format_tags(tags) {
        return format === 'csv' ? tags.join(', ') : tags.join('\n');
    }

    const selectedItems = await eagle.item.getSelected();
    const itemsLen = selectedItems.length;

    if (itemsLen === 0) {
        eagle.notification.show('warning', 'No items selected');
        return;
    }

    if (itemsLen > 1 && !confirm(`Save tags for ${itemsLen} items?`)) {
        return;
    }

    if (itemsLen >= 100 && !confirm(`Large selection (${itemsLen} items). Continue?`)) {
        return;
    }

    const saveDir = await showDirectoryPickerDialog();
    if (!saveDir) return;

    let savedCount = 0;
    selectedItems.forEach((item) => {
        if (item.tags.length === 0) {
            console.warn('No tags on item; skipping...', item);
            return;
        }

        const extension = format === 'csv' ? 'csv' : 'txt';
        const save_filename = `${item.name}.tags.${extension}`;
        const pth = path.join(saveDir, save_filename);
        saveDataToFile(pth, format_tags(item.tags));
        savedCount++;
    });

    eagle.notification.show('info', `Processed ${savedCount} files`);
}

module.exports = {
    name: 'Save Tags',
    render: "index.html",
    mount: (container) => {
        console.log('Save Tags plugin mounted');
        
        // Render the content into the container
        container.innerHTML = module.exports.render();
        
        const updateStatus = async () => {
            const items = await eagle.item.getSelected();
            const statusEl = container.querySelector('#save-tags-status');
            if (statusEl) {
                statusEl.textContent = `Selected Items: ${items.length}`;
            }
        };

        // Initial status update
        updateStatus();

        // Setup button handlers
        container.querySelector('#save-csv-btn')?.addEventListener('click', () => SaveTags('csv'));
        container.querySelector('#save-txt-btn')?.addEventListener('click', () => SaveTags('txt'));

        // Initial selection status
        eagle.item.getSelected().then(items => {
            const statusEl = container.querySelector('#save-tags-status');
            if (statusEl) {
                statusEl.textContent = `Selected Items: ${items.length}`;
            }
        });

        return () => {
            console.log('Save Tags plugin unmounted');
        };
    },

    // Event handlers
    onItemSelected: (newItems, oldItems) => {
        const statusEl = document.querySelector('#save-tags-status');
        if (statusEl) {
            statusEl.textContent = `Selected Items: ${newItems.length}`;
        }
    }
};
