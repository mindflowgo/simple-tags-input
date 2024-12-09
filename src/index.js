/***************************************************************
 * = TAG INPUT = v1.0
 * 
 * Simple tag input engine to allow styling input tags in your code. 
 * Pure javascript, unobtrusive to other code, but DOES require DOM
 * access.
 * 
 * By Filipe Laborde (fil@rezox.com), 7-Dec-2024
 * 
 * Inspired by https://github.com/rk4bir/simple-tags-input - (c) 2022 Raihan Kabir
 * 
 * MIT License: Use as you wish along with the risks of using this.
 * 
 * USAGE:
 * import InputTags from '...'
 * 
 * const inputTags = new InputTags({ 
 *    listId: "tagsList", inputId: "tagsInput", outputId: "saveInput",  // DOM elements to attach to
 *    afterUpdate: mySave                                                  // Pass in function to call with updated tag items
 *    specialKeys: true, delimiter: ';',                                // To record special keys (ex. arrow, etc)
 *    tags: ['first','second'], unique: false, 
 *    autocompleteList: [ "One", "Two", "AutoSelect3", "AutoSelect4"]
 * });
 * 
 * Example reason for changing delimiter from comma: when pressing special keys (Ctrl,Alt), if 
 * multiple pressed
 */
export default class InputTags {
    constructor(props) {
        const { tags, unique, drag, delimiter, specialKeys, afterUpdate, inputId, listId, outputId, autocompleteList }= props;

        const settings = {
            tagCnt: 0,
            tags: [],
            unique: unique || false,
            drag: drag || false,
            dragTag: { fromId: null, toId: null },
            delimiter: delimiter || ',',
            specialKeys: specialKeys || false,
            afterUpdate: afterUpdate || undefined,
            searchItems: autocompleteList || [],
            listID: listId,
            listEl: null,
            inputEl: null,
            outputEl: null,
            searchListEl: null,
        }
        Object.assign(this, settings);

        // initialize plugin
        // try {
            this.inputEl = document.getElementById(inputId);
            this.listEl = document.getElementById(listId);
            if (this.inputEl.tagName != "INPUT" || this.listEl.tagName != "UL") {
                throw new Error("TagsInput: NEED EXISTING input and list element: inputEl, listEl");
            }
            this.outputEl = document.getElementById(outputId) || undefined;
            this.listEl.classList.add("tagsList");
            if (this.drag){
                this.listEl.addEventListener("dragstart", this.handleTagDrag.bind(this));
                this.listEl.addEventListener("dragover", this.handleTagDrag.bind(this));
                this.listEl.addEventListener("dragenter", this.handleTagDrag.bind(this));
                this.listEl.addEventListener("dragend", this.handleTagDrag.bind(this));
            }
 
            // keyup: allows default behavior (ex. Enter = next item)
            // keydown: intercepts keys, must display/move manually
            this.inputEl.addEventListener( this.specialKeys ? "keydown" : "keyup", this.handleInput.bind(this)); 
            document.addEventListener(`__${this.listID}_`, this.handleTagEvent.bind(this));

            // create autocomplete
            if( this.searchItems.length>0 ){
                this.createAutoCompleteElement();
                this.inputEl.addEventListener( "keyup", this.handleAutoCompleteList.bind(this));
            }

            if( tags && tags.length>0 )
                tags.forEach( tag => this.addTag(tag) );

        // } catch (e) {
        //     throw new Error("TagsInput: failed setup, quitting.");
        // }
    }

    // undo all the Input-Tags changes
    destroy() {
        this.inputEl.removeEventListener(this.specialKeys ? "keydown" : "keyup", this.handleInput);
        document.removeEventListener(`__${this.listID}_`, this.handleTagEvent);
        this.listEl.classList.remove("tagsList");
        this.listEl.innerHTML = '';
        if (this.searchItems.length > 0) {
            this.inputEl.removeEventListener("keyup", this.handleAutoCompleteList);
            if (this.searchListEl) this.searchListEl.remove();
        }
        if (this.drag){
            this.listEl.removeEventListener("dragstart", this.handleTagDrag);
            this.listEl.removeEventListener("dragenter", this.handleTagDrag);
            this.listEl.removeEventListener("dragover", this.handleTagDrag);
            this.listEl.removeEventListener("dragend", this.handleTagDrag);
        }
        this.inputEl = null;
        this.listEl = null;
        this.outputEl = null;
        this.searchListEl = null;
    }
    
    // if adjustment to tag set needed, pass that in.
    writeTagOutput(_tags=[]){
        // output to a specified input field (ex. hidden) (if given)
        if( _tags.length>0 ){
            if( this.outputEl  ) this.outputEl.value = _tags.filter(_tag => _tag !== '').join(this.delimiter);            
        } else {
            const outputData = this.tags.filter(_tag => _tag !== '').join(this.delimiter);
            
            if( this.outputEl  ) this.outputEl.value = outputData;
            // calling specified function with tag output (if given)
            if( this.afterUpdate ) this.afterUpdate(outputData);
        }
    }

    encodeHTMLEntities(text) {
        return text.replace(/[\u00A0-\u9999<>\&'"]/g, c => '&#'+c.charCodeAt(0)+';')
    }

    escapeQuotes(text,slash=false) {
        // we do the \\ as well so it's a sort of double-escape, because it un-escapes one level for suggestion box
        return text.replace(/(['"])/g, c => (slash ? '\\' : '') + '&#'+c.charCodeAt(0)+';')
    }

    buildTagsFromDOM(){
        // now refresh tags based on actual DOM elements present
        this.tags = [];
        document.querySelectorAll(`#${this.listID} LI`).forEach(el =>{ if( el.dataset.item ) this.tags.push(el.dataset.item); });
        this.writeTagOutput();
    }

    getTags() {
        return this.tags;
    }

    addTag(tags) {
        /* Add a new tag to the list, if multiple delimiter (ex. comma)-separated, they each become individual tags */
        let _html = '';
        tags.split(this.delimiter).forEach(tag => {
            tags = tag.trim();
            if( tag != '' && (!this.unique || !this.tags.includes(tag)) ){
                this.tags.push(tag);
                this.tagCnt++; // each new entry new cnt, so always unique
                const elementID = this.listID + '_' + this.tagCnt;
                // htmlEntities on html; and escape ' for data-item in case messages structure
                _html += `<li id='${elementID}' data-item='${this.escapeQuotes(tag)}'`
                        +` ${this.drag ? "draggable='true' " : ''}>${this.encodeHTMLEntities(tag)} `
                        +`<span onclick="_tagAction('remove','${this.listID}','','${elementID}')">X</span></li>`;
            }
        });
        this.listEl.innerHTML += _html;
        this.writeTagOutput();
    }

    removeTag(elementID) {
        // as tag-data may not be unique, we use the unique-DOM-id created for entry
        const itemEl = document.getElementById(elementID);
        if( !itemEl ) return;
        itemEl.remove();
        this.buildTagsFromDOM();
    }

    handleInput(e) {
        let key = e.key; // e.code provides Left/Right for Meta,Alt,etc.
        
        if( this.specialKeys ){
            // won't show these special keys if first pressed
            const ignoreSpecialKeys = ['Shift'];
            // we will create tag immediately for any of these special keys pressed
            const firstSpecialKeys = ['Backspace','Enter','←','→','↑','↓','Escape','Tab','CapsLock','F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12'];
            // will allow groupings of these 
            const specialKeyList = ['Control','Meta','Alt'];
            // map any special keys we want symbols to appear for, remap here (and then reference them by their new symbol!)
            const symbolMap = { 
                ArrowLeft: "←", 
                ArrowUp: "↑",
                ArrowRight: "→",
                ArrowDown: "↓"
            }

            if( symbolMap[key] )
                key = symbolMap[key];
            
            if( ignoreSpecialKeys.includes(key) ){ //e.target.value.length == 0 && 
                // we don't want showing shift as it's usually to uppercase a letter
                return;

            } else if( e.target.value.length == 0 && firstSpecialKeys.includes(key) ){
                // SPECIAL KEY + First keypress  (arrows,backspace,enter): immediate tag generation 
                // (their behaviour changes beyond first character to help navigation);
                e.preventDefault();
                
                this.addTag(key);
                e.target.value = "";
                return;

            } else if( key == "Enter" ) {
                // always intercept and prevent enter's default
                e.preventDefault();

            } else {
                // clear any empty commas (,,) - build array of comma separated keys in input
                const priorKeys = e.target.value.split(',').filter(_key => _key.trim() !== '');

                // if it's special characters, we only allow some, and ONLY with other special characters; ignore rest
                const allSpecial = priorKeys.every(_key => specialKeyList.includes(_key));
                const keyAlreadyExists = priorKeys.includes(key);

                if( key.length>2 ){
                    // SPECIAL KEYS - add if unique and prior are special too
                    if( allSpecial && !keyAlreadyExists && specialKeyList.includes(key) ) { 
                        // if prior are special, we allow adding new unique ones
                        e.target.value += (e.target.value.length>0 ? ',' : '') + key;
                    }
                    // special key but, already exists, not on list, etc, so ignoring:
                    // BUT letting system default behaviours bubble -> else add: else { preventDefault(); }

                } else if( allSpecial && e.target.value.length>0 ){
                    // NORMAL KEY: are all prior keys special? -> insert comma before key!
                    // preventDefault in case holding special key and pressing normal (don't want system behaviour)
                    e.preventDefault();
                    e.target.value += ',' + key;
                }
                // otherwise handle normally
            }
        } 

        // Normal processing for keys - add to input (and do search-items if available), unless Enter in which we create tag
        if( key == "Enter") {
            // insert new tag
            this.addTag(e.target.value);
            e.target.value = "";
        }
    }

    handleTagEvent(e) {
        // Handles outside plugin tasks (add/remove tag via event listener)
        const { action, tags, elementID }= e.detail;
        if (action == 'add'){
            this.addTag(tags);
            this.inputEl.value = '';
            this.inputEl.focus();
            if( this.searchListEl ) this.searchListEl.style.display = 'none';

        } else if (action == 'remove'){
            this.removeTag(elementID);
        }
    }

    handleTagDrag(e) {
        if( e.type == 'dragover' ){ e.preventDefault(); return; } // prevent return animation
        if( e.target.tagName != 'LI' ){
            this.dragTag.toId = null;
            return; // care about operations on LI
        }
        const el = e.target;

        if( e.type == 'dragstart' ){
            this.dragTag.fromId = el.id;
            e.dataTransfer.effectAllowed = 'move';
            el.classList.add('tagsDragThis');

        } else if( e.type == 'dragenter' ){
            this.dragTag.toId = el.id;
            // remove all and add to new entry
            document.querySelectorAll(`#${this.listID} LI`).forEach(el => el.classList.remove('tagsDragOver'));
            if( el.id != this.dragTag.fromId ) el.classList.add('tagsDragOver');

        } else if( e.type == 'dragend' ){
            e.preventDefault(); // no event bubbling, ex. if they grabbed the close-box
            document.querySelectorAll(`#${this.listID} LI`).forEach(el => el.classList.remove('tagsDragOver'));
            const fromEl = document.getElementById(this.dragTag.fromId);
            fromEl.classList.remove('tagsDragThis');
            if( this.dragTag.toId && e.offsetY > -30 && e.offsetY < 90 ) { //drop must be in the basic area of the tags else ignore
                const fromNode = fromEl.cloneNode(true); 
                fromEl.remove();
                document.getElementById(this.dragTag.toId).insertAdjacentElement("beforebegin", fromNode);
                // rebuild tag list from new DOM placements
                this.buildTagsFromDOM();
            }
        }
    }

    // == AUTOCOMPLETE CODE ========================================
    toggleAutoComplete(tags) {
        if( !this.searchListEl ) return;
        if( this.searchListEl.style.display == 'none' )
            this.handleAutoCompleteList(null,tags)
        else
            this.searchListEl.style.display = 'none';
    }

    createAutoCompleteElement() {
        // create search list `ul` element and set to `this.searchListEl`
        const elName = this.listID + '_autocomplete';
        const el = `<ul id='${elName}' class='tagsAutocompleteList' style='display: none'></ul>`;
        this.inputEl.insertAdjacentHTML("afterend", el);
        this.searchListEl = document.getElementById(elName);
    }

    handleAutoCompleteList(e, _q='') {
        // on keyup so after key actions complete
        const q = _q || e.target.value.trim();
        let results = [];
        if( q.length>1 ){
            results = this.searchItems.filter(item => item.toLowerCase().indexOf(q.toLowerCase()) != -1);
            const _html = "<p class='tagsAutocompleteListHeader'>Search Result:</p>"
                         + this.suggestTag(results);
            this.searchListEl.innerHTML = _html;
        }
        this.searchListEl.style.display =( q.length>1 && results.length>0 ? 'block' : 'none' );
    }
    
    suggestTag(tagArray) {
        const _html = tagArray.map(tag => `<li onclick="_tagAction('add','${this.listID}','${this.escapeQuotes(tag,true)}')">${this.encodeHTMLEntities(tag)}</li>` ).join('');
        return _html;
    }

} // END of class: TagsInput


// DOM accessible function (injected into HTML)
function _tagAction(action, listID, tags=[], elementID='') {
    let eventDetails = {
        bubbles: true, 
        cancelable: true, 
        detail: { action, tags, elementID }
    };
    const event = new CustomEvent(`__${listID}_`, eventDetails);
    document.dispatchEvent(event);
}
// Expose function to HTML
window._tagAction = _tagAction;