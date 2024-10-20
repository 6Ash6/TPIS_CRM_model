import { delContactSvg, reloaderSvg, svgTel } from "./svg.js";
import { svgFB } from "./svg.js";
import { svgVK } from "./svg.js";
import { svgMail } from "./svg.js";
import { svgOther } from "./svg.js";
import {closeSvg} from "./svg.js";
import {addSvg} from "./svg.js";

(async function () {
  const SERVER_URL = 'http://localhost:3000';
  const $addContactBtn = document.getElementById('form__add-btn'),
    $formAddContact = document.getElementById('form__add-contact');

  const $addModal = document.getElementById("modal__window-add");
  document.getElementById("open__modal").addEventListener('click', function () {
    $addModal.classList.add('open');
  })
  document.getElementById("modal__btn").addEventListener('click', function () {
    $addModal.classList.remove('open');
  })
  //закрыть модальное окно при нажатии на esc
  window.addEventListener('keydown', (e) => {
    if (e.key === "Escape") {
      $addModal.classList.remove('open');
    }
  });

  document.querySelector("#modal__window-add .modal__box-add").addEventListener('click', event => {
    event._isClickWithInModal = true;
  });
  $addModal.addEventListener('click', event => {
    if (event._isClickWithInModal) return;
    event.currentTarget.classList.remove('open');
  });

  //добавляем клиента
  async function serverAddClient(obj) {
    let response = await fetch(SERVER_URL + '/api/clients', { //запрос
      method: "POST",                                //информация о запросе
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(obj), //информция в json
    })

    let data = await response.json()

    return data
  }
  async function serverUpdateClient(obj, id ) {
    let response = await fetch(SERVER_URL + '/api/clients/' + id,  { //запрос
      method: "PATCH",        
      headers: { 'Content-Type': 'application/json' },                        //информация о запросе
      body: JSON.stringify(obj), //информция в json
    })

    let data = await response.json()

    return data
  }


  //получаем данные с сервера
  async function serverGetClient() {
    let response = await fetch(SERVER_URL + '/api/clients', { //запрос
      method: "GET",                                //информация о запросе
      headers: { 'Content-Type': 'application/json' },
    })

    let data = await response.json()

    return data
  }
  async function GetClientByID(id) {
    let response = await fetch(SERVER_URL + '/api/clients' + id, { //запрос
      method: "GET",                                //информация о запросе
      headers: { 'Content-Type': 'application/json' },
    })

    let data = await response.json()

    return data
  }

  async function findClient(value){
    try {
      let response = await fetch(`http://localhost:3000/api/clients?search=${value}`, { //запрос
        method: "GET",                                //информация о запросе
       
      });
      let data = await response.json();
      return data;
    } catch (error) {
      console.log(error);
    }

  }
  async function serverDelete(id) {
    let response = await fetch(SERVER_URL + '/api/clients/' + id, { //запрос
      method: "DELETE",                                //информация о запросе

    })

    let data = await response.json()

    return data
  }

  let serverData = await serverGetClient();

  let clientsList = [];

  if (serverData != null) {
    clientsList = serverData; //добавляем данные с сервера
  }

  let sortFlag = "";
  searchClients(clientsList);

  

  const
    $addForm = document.getElementById('form-add'),
    $inputSurname = document.getElementById('surname-input'),
    $inputName = document.getElementById('name-input'),
    $inputLast = document.getElementById('lastname-input'),
    $removeRormBtn = document.getElementById('form__btn-remove'),

    $table = document.getElementById('table'),
    $tableHead = document.getElementById('thead'),
    $tableBody = document.createElement('tbody'),

    $thRow = document.getElementById('table__row'),
    $thFIO = document.getElementById('th-fio'),
    $thID = document.getElementById('th-id'),
    $thCreate = document.getElementById('th-create'),
    $thChange = document.getElementById('th-change'),
    $thContacts = document.getElementById('th-contacts'),
    $tableDelete = document.getElementById('th-action');

  $tableBody.classList.add('tbody');
  $table.append($tableBody);

  $removeRormBtn.addEventListener('click', (e)=>{
    e.preventDefault;
    $addForm.querySelectorAll('input').forEach(input =>{
      input.value = ''
    });
    
   
  });

  function getDateAt(data) {
    let dat = new Date(data);
    const year = dat.getFullYear();
    let mm = dat.getMonth() + 1;
    let dd = dat.getDate();
    if (dd < 10) dd = '0' + dd;
    if (mm < 10) mm = '0' + mm;

    return dd + '.' + mm + '.' + year;
  }

  function getTimeAt(dat) {
    let hours = new Date(dat).getHours();
    let min = new Date(dat).getMinutes();
    if (min < 10) min = '0' + min;
    let Time = ` ${hours}:${min}`;


    return Time;
  }

 

  function Preloader(){
    const preloaderBlock = document.createElement('div');
    const preloaderCircle = document.createElement('span');

    preloaderBlock.classList.add('preloader');
    preloaderCircle.id = 'loader';

    preloaderCircle.innerHTML = reloaderSvg;

    preloaderBlock.append(preloaderCircle);

    return preloaderBlock;

  };
 



  function createContactLink(type, value, element, svg, item){
    const contactTooltip = createTooltip(type, value);
    element = document.createElement('a');
    element.classList.add('contacts__link');
    element.innerHTML = svg;

    if(type === 'Email'){
      element.href = `mailto:${value.trim()}`;
    }
    else if(type === 'Телефон' || type === 'Доп. телефон' ){
      element.href = `tel:${value.trim()}`;
      contactTooltip.toolValue.style.color = 'var(--white)';
      contactTooltip.toolValue.style.textDecoration = 'none';
      contactTooltip.toolType.textContent = '';

    }
    else{
      element.href = value.trim();
    }
    element.append(contactTooltip.tooltip);
    item.append(element);


  }

  function createContactIcon(type, value, item){
    switch (type){
      case 'Телефон':
        let phone;
        createContactLink(type, value, phone, svgTel, item);
        break;
      case 'Доп. телефон':
        let phoneMore;
        createContactLink(type, value, phoneMore, svgTel, item);
        break;
      case 'Email':
        let email;
        createContactLink(type, value, email, svgMail, item);
        break;
        case 'Другое':
        let other;
        createContactLink(type, value, other, svgOther, item);
        break;
      case 'Vk':
        let vk;
        createContactLink(type, value, vk, svgVK, item);
        break;
      case 'Facebook':
        let fb;
        createContactLink(type, value, fb, svgFB, item);
        break;
      default:
        break;

    }
  }
  let contacts = [];

  // function validateForm(){
  //   const userName = document.getElementById('')
  // };




  function createModal(client, $clientTR){
    const $modalWindow = document.createElement('div');
    $modalWindow.classList.add('modal__window');
    $modalWindow.setAttribute('id', 'modal__window-edit') ;
    const $modalBox = document.createElement('div');
    $modalBox.classList.add('modal__box-add');
    const $modalClose = document.createElement('button');
    $modalClose.classList.add('modal__btn');
    $modalClose.innerHTML = closeSvg;
    const $modalTitle = document.createElement('h3');
    $modalTitle.classList.add('modal__title', '--modal__title-edit');
    $modalTitle.textContent = `Изменить данные`;
    const  $modalTitleId = document.createElement('span');
    $modalTitleId.classList.add('modal__title-id');
    $modalTitleId.textContent = `ID:` + client.id;
   
    $modalTitle.append($modalTitleId);
    const $modalEditForm = document.createElement('form');
    $modalEditForm.classList.add('form-add', 'form');
    let formGroup1 = document.createElement('div');
    let formGroup2 = document.createElement('div');
    let formGroup3 = document.createElement('div');
    formGroup1.classList.add('form-group');
    formGroup2.classList.add('form-group');
    formGroup3.classList.add('form-group');
    const $modalSurname = document.createElement('input');
    const $modalName = document.createElement('input');
    const $modalLastname = document.createElement('input');
    $modalSurname.classList.add('form__input');
    $modalSurname.setAttribute('required', 'required');
    $modalName.classList.add('form__input');
    $modalName.setAttribute('required', 'required');
    $modalLastname.classList.add('form__input');
    $modalLastname.setAttribute('required', 'required');
    const $labelSurname = document.createElement('label');
    const $labelName = document.createElement('label');
    const $labelLastname = document.createElement('label');

    const $errorBlock = document.createElement('div');
    $errorBlock.classList.add('error-box');
   



    $modalSurname.value = client.surname;
    $modalName.value = client.name;
    $modalLastname.value = client.lastName;
   

    $labelSurname.classList.add('label');
    $labelSurname.innerHTML = `Фамилия <span>*</span>`;
   

    $labelName.classList.add('label');
    $labelName.innerHTML = `Имя <span>*</span>`;
   

    $labelLastname.classList.add('label');
    $labelLastname.innerHTML = `Отчество`;
   

    formGroup1.append($modalSurname, $labelSurname);
    formGroup2.append($modalName, $labelName);
    formGroup3.append($modalLastname, $labelLastname);
     
    const $editDiv = document.createElement('div');
    $editDiv.classList.add('form__add-contact');
    const $wrapper = document.createElement('div');
    $wrapper.classList.add('form-wrapper');
    const $contactBtn = document.createElement('button');
    $contactBtn.classList.add('btn__add-contact');
    $contactBtn.innerHTML = addSvg + `Добавить контакт`;
    $wrapper.append($contactBtn);
    $editDiv.append($wrapper);

    
   const $buttonGroup = document.createElement('div');
    
   const $wrapperRem = document.createElement('div');
   $wrapperRem.classList.add('modal__wrapper-rem');
   $buttonGroup.classList.add('form__btn-group');
   const $saveBtn = document.createElement('button');
   $saveBtn.textContent = 'Сохранить';
  
   const $remBtn = document.createElement('button');
   $remBtn.textContent = 'Удалить клиента';
   $saveBtn.classList.add('form__btn-save');
   $remBtn.classList.add('form__btn-remove');
   $buttonGroup.append($saveBtn);
   $wrapperRem.append($remBtn);
   $remBtn.addEventListener('click', (e)=>{
    e.preventDefault;
    $modalWindow.classList.remove('open');
    let delModal = createDeleteModal(client, $clientTR);
    document.body.append(delModal);
   
      delModal.classList.add('open');
  
 
  //закрыть модальное окно при нажатии на esc
  window.addEventListener('keydown', (e) => {
    if (e.key === "Escape") {
      delModal.classList.remove('open');
    }
  });

  delModal.addEventListener('click', event => {
    if (event._isClickWithInModal) return;
    event.currentTarget.classList.remove('open');
  });
   });
   $modalEditForm.append(formGroup1, formGroup2, formGroup3, $editDiv,  $buttonGroup);

   $modalBox.append($modalClose, $modalTitle, $modalEditForm,$errorBlock, $wrapperRem);
   $modalWindow.append($modalBox);

   $modalEditForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    // if( validation($modalEditForm) == true){

    let contactsTypes = document.querySelectorAll('.add__select');
    let contactsValues = document.querySelectorAll('.add__input');
    
    for (let i = 0; i < contactsValues.length; i++) {
      contacts.push({
        type: contactsTypes[i].value,
        value: contactsValues[i].value,
      })


    }
    let newClient = {

      name: $modalName.value.trim(),
      surname: $modalSurname.value.trim(),
      lastName: $modalLastname.value.trim(),
      contacts: contacts,

    }
   

     await serverUpdateClient(newClient, client.id);
   
    renderClientsTable(clientsList);
    location.reload();
  }
 
    

 )


    $modalClose.addEventListener('click', function () {
      $modalWindow.classList.remove('open');

    });
    $modalBox.addEventListener('click', event => {
      event._isClickWithInModal = true;
    });
   
  return {
    $modalWindow,
    $editDiv,
    $contactBtn,
    $modalEditForm,
    $modalSurname,
    $modalName,
    $modalLastname,

  }
  

  }
  function createDeleteModal(client, $clientTR){
    const $modalWindow = document.createElement('div');
    $modalWindow.classList.add('modal__window');
    const $modalBox = document.createElement('div');
    $modalBox.classList.add('modal__box-add', '--modal__del');
    const $modalClose = document.createElement('button');
    $modalClose.classList.add('modal__btn');
    $modalClose.innerHTML = closeSvg;
    const $modalTitle = document.createElement('h3');
    $modalTitle.classList.add('modal__title', '--modal__title-del');
    $modalTitle.textContent = `Удалить клиента`;
    const $modalDescr = document.createElement('p');
    $modalDescr.classList.add('modal__del-descr');
    $modalDescr.textContent = ` Вы действительно хотите удалить данного клиента?`;

   const $buttonGroup = document.createElement('div');
   $buttonGroup.classList.add('form__btn-group');
   const $delBtn = document.createElement('button');
   $delBtn.textContent = 'Удалить клиента';
  
   const $remBtn = document.createElement('button');
   $remBtn.textContent = 'Отмена';
   $delBtn.classList.add('form__btn-save');
   $remBtn.classList.add('form__btn-remove');
   $buttonGroup.append($delBtn, $remBtn);

   $modalBox.append($modalClose,$modalTitle, $modalDescr, $buttonGroup);
   $modalWindow.append($modalBox);

   $modalClose.addEventListener('click', function () {
    $modalWindow.classList.remove('open');

  });
  $modalBox.addEventListener('click', event => {
    event._isClickWithInModal = true;
  });
  $delBtn.addEventListener('click', async function () {
    await serverDelete(client.id)
    $clientTR.remove()
    location.reload();

  })

   return $modalWindow;
  }


  function createClient(client) {
    const $clientTR = document.createElement('tr'),
      $clientID = document.createElement('td'),
      $clientFIO = document.createElement('td'),
      $clientCreate = document.createElement('td'),
      $clientUpdate = document.createElement('td'),
      $clientContacts = document.createElement('td'),
      $clientDelete = document.createElement('td'),
      $btnDelete = document.createElement('button'),
      $clientsEdit = document.createElement('button');

    

    $clientsEdit.addEventListener('click', function () {
      const $editModal = createModal(client, $clientTR);
    document.body.append($editModal.$modalWindow);
      
      $editModal.$modalWindow.classList.add('open');
      window.addEventListener('keydown', (e) => {
        if (e.key === "Escape") {
          $editModal.$modalWindow.classList.remove('open');
         
        }
      });
    
     
      $editModal.$modalWindow.addEventListener('click', event => {
        if (event._isClickWithInModal) return;
        event.currentTarget.classList.remove('open');
        
      });
     
      
      for (const contact of client.contacts){
       const editContact = createContact();
       editContact.element.textContent = contact.type;
       editContact.addContactInput.value = contact.value;
      
        $editModal.$editDiv.prepend(editContact.addContactDiv);
        
      }
      $editModal.$contactBtn.addEventListener('click', function (e) {
        e.preventDefault();
        clicks++;
        if(client.contacts.length + clicks > 10){
          $editModal.$contactBtn.remove();
        }
        else if (client.contacts.length + clicks <= 10) {
          const $editContact = createContact()
    
          $editModal.$editDiv.prepend($editContact.addContactDiv);
        }
        else if (clicks > 10) {
          $editModal.$contactBtn.remove();
    
        }
       
        })
    
    })
   
   
   
     
    
    const $delModal = createDeleteModal(client,$clientTR);
    document.body.append($delModal);
    
    $btnDelete.addEventListener('click', function () {
      $delModal.classList.add('open');
  })
 
  //закрыть модальное окно при нажатии на esc
  window.addEventListener('keydown', (e) => {
    if (e.key === "Escape") {
      $delModal.classList.remove('open');
    }
  });

  $delModal.addEventListener('click', event => {
    if (event._isClickWithInModal) return;
    event.currentTarget.classList.remove('open');
  });

    $clientID.classList.add('clients__td', 'clients__ID');
    $clientFIO.classList.add('clients__td', 'clients__td-fio');
    $clientCreate.classList.add('clients__td', 'clients__createAt');
    $clientUpdate.classList.add('clients__td','clients__udateAt');
    $clientDelete.classList.add('clients__td', 'clients__action');
    $clientContacts.classList.add('clients__td', 'clients__td-contacts');

    $clientTR.classList.add('clients__tr');

    $btnDelete.classList.add('btn', 'btn-delete');
    $btnDelete.textContent = 'Удалить';
    $clientsEdit.classList.add('btn', 'btn-edit')
    $clientsEdit.textContent = 'Изменить';
    $clientDelete.append($clientsEdit, $btnDelete );

    let timeSpan = document.createElement('span');
    timeSpan.classList.add('time-span');
    timeSpan.textContent = getTimeAt(client.updatedAt);

    let dateSpan = document.createElement('span');
    dateSpan.classList.add('date-span');
    dateSpan.textContent = getDateAt(client.updatedAt);

    let timeSpanCreate = document.createElement('span');
    timeSpanCreate.classList.add('time-span');
    timeSpanCreate.textContent = getTimeAt(client.createdAt);

    let dateSpanCreate = document.createElement('span');
    dateSpanCreate.classList.add('date-span');
    dateSpanCreate.textContent = getDateAt(client.createdAt);

    $clientFIO.textContent = `${client.surname} ${client.name} ${client.lastName}`;
    $clientID.textContent = client.id.substr(0, 6);
    // $clientUpdate.textContent = getDateAt(client.updatedAt) + timeSpan ;
    $clientUpdate.append(dateSpan, timeSpan);
    $clientCreate.append(dateSpanCreate, timeSpanCreate);

    for (const contact of client.contacts){
      createContactIcon(contact.type, contact.value, $clientContacts );
    }
   // $clientContacts.textContent = `${client.contacts}`;

    $clientTR.append($clientID);
    $clientTR.append($clientFIO);
    $clientTR.append($clientCreate);
    $clientTR.append($clientUpdate);
    $clientTR.append($clientContacts);
    $clientTR.append($clientDelete);

    return $clientTR;
  };
 

    let mask = document.querySelector('.mask');
    // mask.classList.add('mask');
    // let loader = document.createElement('div');
    // loader.classList.add('loader');
    // mask.append(loader);
    // $tableBody.append(mask);
   
    window.addEventListener('load', ()=>{
      mask.classList.add('hide');
      setTimeout(() =>{
        mask.remove();
      },600);
  
    });
      

    function searchClients(clientsList){
      const $searchClient = document.getElementById('search');
      const $inner = document.getElementById('inner');
      const $findList = document.createElement('ul');
      $findList.classList.add('header__find-list', 'hide');
      $inner.append($findList);
      
      clientsList.forEach(client => {
        const findItem = document.createElement('li');
        const findLnk =  document.createElement('a');

        findItem.classList.add('find-item');
        findLnk.classList.add('find-link');

        findLnk.textContent = `${client.surname} ${client.name} ${client.lastName}`;
        findLnk.href = '#';

        findItem.append(findLnk);
        $findList.append(findItem);

        
      });
      const rewriteTable = async (str)=>{
        const response = await findClient(str);
        $tableBody.innerHTML = '';
        for(const client of response){ 
           $tableBody.append(createClient(client));
        }
  
      }
      $searchClient.addEventListener('input', async ()=>{
        const value = $searchClient.value.trim();
        const foundItems = document.querySelectorAll('.find-link');

        if(value !==''){
          rewriteTable(value);

          foundItems.forEach(link =>{
            if(link.textContent.search(value) ==-1){
              link.classList.add('hide');
              link.innerHTML = link.textContent;
            } else{
              link.classList.remove('hide');
              $findList.classList.remove('hide');
              const str = link.textContent;
              link.innerHTML = insertMark(str, link.textContent.search(value), value.length);
            }
          });
        }else{
          foundItems.forEach(link =>{
            $tableBody.innerHTML = '';

            clientsList.forEach(client => $tableBody.append(createClient(client)));

            link.classList.remove('hide');
            $findList.classList.add('hide');
            link.innerHTML = link.textContent;
          });
        }
      });
      const insertMark =(str, pos, len) =>str
        .slice(0,pos) + '<mark class = "mark" >' + str
        .slice(pos, pos + len) + '</mark>' + str
        .slice(pos + len);
    


    };

   


  function renderClientsTable(clientsList) {
    
    $tableBody.innerHTML = '';
    
    clientsList = clientsList.sort(function(a, b){ //сортировка
      if(a[sortFlag] < b[sortFlag])  return -1;
    })
   

    
    for (const client of clientsList) {
      const $NewTR = createClient(client);
      $tableBody.append($NewTR);
    }

    
  };


  function createTooltip(type, value){
    const tooltip = document.createElement('div');
    const toolType = document.createElement('span');
    const toolValue = document.createElement('a');

    tooltip.classList.add('site-tooltip', 'contact__tooltip');
    toolType.classList.add('contact__tooltip-type');
    toolValue.classList.add('contact__tooltip-value');

    toolType.textContent = type + ': ';
    toolValue.textContent = value;

    tooltip.append(toolType, toolValue);

    return{
      tooltip,
      toolType,
      toolValue,
    }

  };



  function createContact() {
    const element = document.createElement('select');
    let addContactInput = document.createElement('input');
    let addContactDiv = document.createElement('div');
    let deleteContact = document.createElement('button');
    addContactDiv.classList.add('add__group');
    deleteContact.classList.add('btn__delete-contact', 'btn');
    // deleteContact.classList.add('add__group');
    deleteContact.innerHTML = delContactSvg;
    const deleteTooltip = document.createElement('span');
    deleteTooltip.classList.add('contact__tooltip', 'site-tooltip');
    deleteTooltip.textContent = 'Удалить контакт';
    deleteContact.append(deleteTooltip);

    deleteContact.addEventListener('click', (e) =>{
      e.preventDefault();
      addContactDiv.remove();
    });

    element.classList.add('add__select');
    element.append(new Option("Телефон", "Телефон"));
    element.append(new Option("Доп. телефон", "Доп. телефон"));
    element.append(new Option("Email", "Email"));
    element.append(new Option("Vk", "Vk"));
    element.append(new Option("Facebook", "Facebook"));
    element.append(new Option("Другое", "Другое"));


    addContactInput.classList.add('add__input');
    addContactInput.placeholder = "Введите данные контакта"
    addContactDiv.append(element, addContactInput, deleteContact);
   


    const choices = new Choices(element, {
      searchEnabled: false,
      itemSelectText: ""
    });
    const selected = document.querySelector(".choices__item.choices__item--selectable");


    return {addContactDiv,
            addContactInput,
            element,
            selected,
            deleteContact,}


  }

  let clicks = 0;
  $addContactBtn.addEventListener('click', function (e) {
    e.preventDefault();
    clicks++;
    if (clicks <= 10) {
      const createdContact = createContact();

      $formAddContact.prepend(createdContact.addContactDiv);
    }
    else if (clicks > 10) {
      $addContactBtn.remove();

    }


  });

  function validation(form){
    function removeError(input){
      const parent = input.parentNode;
      if(parent.classList.contains('error')){
        const errorBox = document.querySelector('.error-box');
        errorBox.querySelector('.error-label').remove();
        parent.classList.remove('error');
      }
    }


    function createError(input, text){
      const parent = input.parentNode;
      const errorBox = document.querySelector('.error-box');
      const errorLabel = document.createElement('p');

      errorLabel.classList.add('error-label');
      errorLabel.textContent = text;
     
      parent.classList.add('error');

      errorBox.append(errorLabel);
    }


    let result = true;
    form.querySelectorAll('input').forEach(input =>{
      
      if(input.value ==""){
        removeError(input);
        console.log('error');
        createError(input, "Поле не заполнено!")
        result = false;
      }

    });


    return result

  }

 
 

  $addForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    if( validation(this) == true){

    let contactsTypes = document.querySelectorAll('.add__select');
    let contactsValues = document.querySelectorAll('.add__input');
    
    for (let i = 0; i < contactsValues.length; i++) {
      contacts.push({
        type: contactsTypes[i].value,
        value: contactsValues[i].value,
      })


    }


    let newClient = {

      name: $inputName.value.trim(),
      surname: $inputSurname.value.trim(),
      lastName: $inputLast.value.trim(),
      contacts: contacts,

    }
   

    let servDataObj = await serverAddClient(newClient);



  
    clientsList.push(servDataObj);
    renderClientsTable(clientsList);

   }
    


    
  })

  renderClientsTable(clientsList);

  $thFIO.addEventListener('click', function() {
    let arrow = document.querySelector('.arrow');
    arrow.classList.add('active');
    sortFlag = 'surname';
    renderClientsTable(clientsList);

  })
  $thID.addEventListener('click', function() {
    sortFlag = 'id';
    renderClientsTable(clientsList);

  })
  $thCreate.addEventListener('click', function() {
    sortFlag = 'createdAt';
    renderClientsTable(clientsList);

  })
  $thChange.addEventListener('click', function() {
    sortFlag = 'updatedAt';
    renderClientsTable(clientsList);

  })




})();