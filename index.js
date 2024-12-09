export default class t{constructor(t){let{tags:e,unique:s,delimiter:i,specialKeys:l,afterUpdate:a,inputId:n,listId:h,outputId:r,autocompleteList:u}=t,o={tagCnt:0,tags:[],unique:s||!1,delimiter:i||",",specialKeys:l||!1,afterUpdate:a||void 0,searchItems:u||[],listID:h,listEl:null,inputEl:null,outputEl:null,searchListEl:null};if(Object.assign(this,o),this.inputEl=document.getElementById(n),this.listEl=document.getElementById(h),"INPUT"!=this.inputEl.tagName||"UL"!=this.listEl.tagName)throw Error("TagsInput: NEED EXISTING input and list element: inputEl, listEl");this.outputEl=document.getElementById(r)||void 0,this.listEl.classList.add("tagsList"),this.inputEl.addEventListener(this.specialKeys?"keydown":"keyup",this.handleInput.bind(this)),document.addEventListener(`__${this.listID}_`,this.handleTagEvent.bind(this)),this.searchItems.length>0&&(this.createAutoCompleteElement(),this.inputEl.addEventListener("keyup",this.handleAutoCompleteList.bind(this))),e&&e.length>0&&e.forEach(t=>this.addTag(t))}destroy(){this.inputEl.removeEventListener(this.specialKeys?"keydown":"keyup",this.handleInput),document.removeEventListener(`__${this.listID}_`,this.handleTagEvent),this.listEl.classList.remove("tagsList"),this.listEl.innerHTML="",this.searchItems.length>0&&(this.inputEl.removeEventListener("keyup",this.handleAutoCompleteList),this.searchListEl&&this.searchListEl.remove()),this.inputEl=null,this.listEl=null,this.outputEl=null,this.searchListEl=null}writeTagOutput(t=[]){if(t.length>0)this.outputEl&&(this.outputEl.value=t.filter(t=>""!==t).join(this.delimiter));else{let e=this.tags.filter(t=>""!==t).join(this.delimiter);this.outputEl&&(this.outputEl.value=e),this.afterUpdate&&this.afterUpdate(e)}}encodeHTMLEntities(t){return t.replace(/[\u00A0-\u9999<>\&'"]/g,t=>"&#"+t.charCodeAt(0)+";")}escapeQuotes(t,e=!1){return t.replace(/(['"])/g,t=>(e?"\\":"")+"&#"+t.charCodeAt(0)+";")}getTags(){return this.tags}addTag(t){let e="";t.split(this.delimiter).forEach(s=>{if(t=s.trim(),""!=s&&(!this.unique||!this.tags.includes(s))){this.tags.push(s),this.tagCnt++;let i=this.listID+"_"+this.tagCnt;e+=`<li id='${i}' data-item='${this.escapeQuotes(s)}'>${this.encodeHTMLEntities(s)} <span onclick="_tagAction('remove','${this.listID}','','${i}')">X</span></li>`}}),this.listEl.innerHTML+=e,this.writeTagOutput()}removeTag(t){let e=document.getElementById(t);e&&(e.remove(),this.tags=[],document.querySelectorAll(`#${this.listID} LI`).forEach(t=>{t.dataset.item&&this.tags.push(t.dataset.item)}),this.writeTagOutput())}handleInput(t){let e=t.key;if(this.specialKeys){let s=["Control","Meta","Alt"],i={ArrowLeft:"←",ArrowUp:"↑",ArrowRight:"→",ArrowDown:"↓"};if(i[e]&&(e=i[e]),["Shift"].includes(e))return;if(0==t.target.value.length&&["Backspace","Enter","←","→","↑","↓","Escape","Tab","CapsLock","F1","F2","F3","F4","F5","F6","F7","F8","F9","F10","F11","F12"].includes(e)){t.preventDefault(),this.addTag(e),t.target.value="";return}if("Enter"==e)t.preventDefault();else{let l=t.target.value.split(",").filter(t=>""!==t.trim()),a=l.every(t=>s.includes(t)),n=l.includes(e);e.length>2?a&&!n&&s.includes(e)&&(t.target.value+=(t.target.value.length>0?",":"")+e):a&&t.target.value.length>0&&(t.preventDefault(),t.target.value+=","+e)}}"Enter"==e&&(this.addTag(t.target.value),t.target.value="")}handleTagEvent(t){let{action:e,tags:s,elementID:i}=t.detail;"add"==e?(this.addTag(s),this.inputEl.value="",this.inputEl.focus(),this.searchListEl&&(this.searchListEl.style.display="none")):"remove"==e&&this.removeTag(i)}toggleAutoComplete(t){this.searchListEl&&("none"==this.searchListEl.style.display?this.handleAutoCompleteList(null,t):this.searchListEl.style.display="none")}createAutoCompleteElement(){let t=this.listID+"_autocomplete",e=`<ul id='${t}' class='tagsAutocompleteList' style='display: none'></ul>`;this.inputEl.insertAdjacentHTML("afterend",e),this.searchListEl=document.getElementById(t)}handleAutoCompleteList(t,e=""){let s=e||t.target.value.trim(),i=[];if(s.length>1){i=this.searchItems.filter(t=>-1!=t.toLowerCase().indexOf(s.toLowerCase()));let l="<p class='tagsAutocompleteListHeader'>Search Result:</p>"+this.suggestTag(i);this.searchListEl.innerHTML=l}this.searchListEl.style.display=s.length>1&&i.length>0?"block":"none"}suggestTag(t){let e=t.map(t=>`<li onclick="_tagAction('add','${this.listID}','${this.escapeQuotes(t,!0)}')">${this.encodeHTMLEntities(t)}</li>`).join("");return e}};function _tagAction(t,e,s=[],i=""){let l=new CustomEvent(`__${e}_`,{bubbles:!0,cancelable:!0,detail:{action:t,tags:s,elementID:i}});document.dispatchEvent(l)}window._tagAction=_tagAction;