document.addEventListener("DOMContentLoaded", function () {


    const currentPath = window.location.pathname;
    const filename = currentPath.split("/").pop();

    if (filename.includes('signup')) {

        PageHandler.signup();

    }

    else if (filename.includes('login')) {

        PageHandler.login();

    }

    else if (filename.includes('dashboard')) {

        PageHandler.dashboard();
    }

    else if (filename.includes('callback')) {
        new CallbackHanlder();
    }

    else if (filename.includes('logout')) {
        new LogoutPageHandler();
    }

    else{
        IndexPage.updateTopButton();
        InternalLink.update('signup', 'signup');
        InternalLink.update('login', 'login');
    }

});



class PageHandler {
    static dashboard() {

        if (Utils.checkLogin()) {

            // Update the interlinks
            InternalLink.update('dashboard', 'dashboard');
            InternalLink.update('logout', 'logout');

            // Update profile photo on the top and sidebar

            new Profile().updateTop();
            new Profile().updateSidebar();

            // Handle Dashboard Add Entry Form and Add Category Form
            new DashboardAddEntryHandler();
            new DashboardAddCategoryHandler();

            // Handle Listing of diary entries
            new ListEntriesHandler().showEntries();

            // Handle search
            new SearchBarHandler();

            // Update streak
            new StreakHandler().updateCount();
        }

        else {
            new Redirect().to_login();
        }
    }

    static login() {
        if (Utils.checkLogin()) {
            new Redirect().to_dashboard();

        }

        else {
            // Update Internal links
            InternalLink.update('signup', 'signup');

            // Handle Login Form and Login with Google Button
            new LoginFormHandler();
            new LoginWithGoogleButtonHandler();
        }
    }

    static signup() {

        if (Utils.checkLogin()) {
            new Redirect().to_dashboard();

        }

        else {
            // Update Internal Links
            InternalLink.update('login', 'login');

            // Handle Signup Form and Login with Google Button
            new SignupFormHandler();
            new LoginWithGoogleButtonHandler();
        }
    }

}




class Config {
    constructor() {
        // this.localhost = false;
        this.localhost = true;
        this.serverApiBaseUrl = "http://127.0.0.1:5000";
        this.defaultProfilePhoto = "https://flowbite.com/docs/images/people/profile-picture-5.jpg"
    }
}

class InternalLink {
    static update(dataAttribute, location) {
        const config = new Config();
        var elements = document.querySelectorAll(`[data-link="${dataAttribute}"]`);

        elements.forEach(element => {
            element.href = config.localhost ? `/${location}.html` : `/${location}`;
        });

    }
}


class Redirect {
    constructor() {
        this.config = new Config;
    }

    to_dashboard() {
        const redirectUrl = this.config.localhost ? "dashboard.html" : "/dashboard"
        window.location.href = redirectUrl;
    }

    to_login() {
        const redirectUrl = this.config.localhost ? "login.html" : "/login"
        window.location.href = redirectUrl
    }

    to_home() {
        const redirectUrl = this.config.localhost ? "/" : "/"
        window.location.href = redirectUrl
    }
}

class ApiRequestUtils {
    static config = new Config();

    static async authRequest(endpoint, data) {
        try {
            const response = await fetch(`${this.config.serverApiBaseUrl}/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            return response.json();
        } catch (error) {
            console.error('Auth error:', error);
            throw error;
        }
    }

    static isTokenExpired() {
        const tokenTimestamp = localStorage.getItem('tokenTimestamp');
        if (!tokenTimestamp) return true;
        const currentTime = Date.now();
        const tokenAge = (currentTime - parseInt(tokenTimestamp)) / 1000 / 60; // in minutes
        // Token expires in 15mins
        return tokenAge >= 14;
    }

    static async refreshToken() {
        const refreshToken = localStorage.getItem('refreshToken');

        try {
            const response = await fetch(`${this.config.serverApiBaseUrl}/auth/refresh`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${refreshToken}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();

            if (data.error) throw new Error(data.message);

            localStorage.setItem('accessToken', data.access_token);
            localStorage.setItem('tokenTimestamp', Date.now().toString());

            return data.access_token;

        } catch (error) {
            console.error('Token refresh error:', error);
            throw error;
        }
    }

    static async getValidAccessToken() {
        if (this.isTokenExpired()) {
            // This will refresh the accessToken and update the accessToken and tokenTimestamp
            return await this.refreshToken();
        }

        // If not expired then get the accessToken
        return localStorage.getItem('accessToken');
    }

    static async request(endpoint, data = null, method = "GET") {
        try {
            const accessToken = await this.getValidAccessToken();

            const options = {
                method: method,
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            };

            if (method !== "GET" && data) {
                options.body = JSON.stringify(data);
            }

            const response = await fetch(`${this.config.serverApiBaseUrl}/${endpoint}`, options);
            return response.json();

        } catch (error) {
            console.error('Request error:', error);
            throw error;
        }
    }
}


class Utils {
    static getFormData(formId) {
        const form = document.getElementById(formId);
        const formData = new FormData(form);
        const data = {};
        for (const [key, value] of formData) {
            data[key] = value;
        }

        return data;
    }

    static formatDate(dateString) {
        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }

    static decodeEmoji(emojiCode) {
        return String.fromCodePoint(...emojiCode.split('\\u').filter(Boolean).map(u => parseInt(u, 16)));
    }

    static showAlert(message, isError, alertDiv) {
        alertDiv.style.display = 'block';
        alertDiv.classList.remove('bg-red-50', 'text-red-800', 'dark:text-red-400', 'bg-green-50', 'text-green-800', 'dark:text-green-400');

        if (isError) {
            alertDiv.classList.add('bg-red-50', 'text-red-800', 'dark:text-red-400');
        } else {
            alertDiv.classList.add('bg-green-50', 'text-green-800', 'dark:text-green-400');
        }

        alertDiv.querySelector('#alert-message').innerHTML = message;


        setTimeout(() => this.hideAlert(alertDiv), 3000);
    }

    static showLoader(loader) {
        loader.style.display = 'inline-block';
    }

    static hideLoader(loader) {
        loader.style.display = 'none';
    }

    static hideAlert(alertDiv) {
        alertDiv.style.display = 'none';
    }

    static checkLogin() {
        return localStorage.getItem('accessToken') &&
            localStorage.getItem('refreshToken') &&
            localStorage.getItem('tokenTimestamp') ? true : false;
    }


    static getQueryParams() {
        let params = {};
        let searchParams = new URLSearchParams(window.location.search);
        for (let [key, value] of searchParams.entries()) {
            params[key] = value;
        }
        return params;

    }

    static base64Decode(encodedString) {
        const decodedString = atob(encodedString);
        return decodedString;
    }

    static closeModal(querySelectorText) {
        document.querySelector(querySelectorText).click();
    }
}

class LocalStorageUtils {
    saveTokenCreds(responseData) {
        localStorage.setItem('accessToken', responseData.tokens.access);
        localStorage.setItem('refreshToken', responseData.tokens.refresh);
        localStorage.setItem('tokenTimestamp', Date.now().toString());
    }

    saveUserInfo(responseData) {
        localStorage.setItem('userInfo', JSON.stringify(responseData.details))
    }

    getUsername() {
        var userInfo = JSON.parse(localStorage.getItem('userInfo'));
        var username = userInfo.username;

        return username;
    }

    getProfilePicture() {
        const config = new Config();
        var userInfo = JSON.parse(localStorage.getItem('userInfo'));
        if (userInfo.profilePicture) {
            var profilePicture = userInfo.profilePicture;
        }
        else {
            var profilePicture = config.defaultProfilePhoto;
        }

        return profilePicture;
    }


    getUserId() {
        var userInfo = JSON.parse(localStorage.getItem('userInfo'));
        var userId = userInfo.userId.split("-")[0];


        return userId;
    }

    removeEverything() {
        localStorage.removeItem("userInfo");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("tokenTimestamp");
    }

}

class CallbackHanlder {
    constructor() {
        this.config = new Config();
        this.alertDiv = document.getElementById('alert-box');
        this.storage = new LocalStorageUtils();
        this.localhost = this.config.localhost;
        this.redirect = new Redirect(this.localhost);

        if (this.codeParamExists()) {
            this.handleCallback();
        }
        else {
            this.redirect.to_dashboard()
        }
    }

    codeParamExists() {
        const params = Utils.getQueryParams();
        return params.code && params.code != ""
    }

    async handleCallback() {
        const params = Utils.getQueryParams();
        const tokenDataStr = Utils.base64Decode(params.code);

        const jsonString = tokenDataStr.replace(/'/g, '"').replace(/False/g, 'false').replace(/True/g, 'true');

        const tokenData = JSON.parse(jsonString);

        const isError = tokenData.error;


        Utils.showAlert(tokenData.message, isError, this.alertDiv);


        if (!isError) {
            this.storage.saveTokenCreds(tokenData);


            Utils.showAlert("Please Wait...", false, this.alertDiv);

            const userResponseData = await ApiRequestUtils.request("user/info")
            this.storage.saveUserInfo(userResponseData);

            Utils.showAlert(userResponseData.message, userResponseData.error, this.alertDiv);

            setTimeout(() => this.redirect.to_dashboard(), 1000);
        }


    }
}


class SignupFormHandler {
    constructor() {
        this.form = document.getElementById('signup-form');
        this.loader = document.querySelector('.auth-loader');
        this.alertDiv = document.getElementById('alert-box');
        this.form.addEventListener('submit', async (e) => await this.handleSubmit(e));
        this.redirect = new Redirect();
    }

    async handleSubmit(e) {
        e.preventDefault();
        Utils.showLoader(this.loader);

        const formData = Utils.getFormData('signup-form');
        try {
            const responseData = await ApiRequestUtils.authRequest('auth/signup', formData);
            Utils.showAlert(responseData.message, responseData.error, this.alertDiv);
        }

        catch (error) {
            Utils.showAlert('An unexpected error occurred. Please try again.', true, this.alertDiv);
        }

        finally {
            Utils.hideLoader(this.loader);
            this.redirect.to_login();
        }
    }
}

class LogoutPageHandler {
    constructor() {
        this.stoage = new LocalStorageUtils();
        this.stoage.removeEverything();
        new Redirect().to_home();
    }
}

class LoginFormHandler {
    constructor() {
        this.config = new Config();
        this.form = document.querySelector('form');
        this.loader = document.querySelector('.auth-loader');
        this.alertDiv = document.getElementById('alert-box');
        this.localhost = this.config.localhost;
        this.redirect = new Redirect(this.localhost);
        this.storage = new LocalStorageUtils();
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    async handleSubmit(e) {
        e.preventDefault();
        Utils.showLoader(this.loader);

        const formData = Utils.getFormData('login-form');
        try {
            const tokenResponseData = await ApiRequestUtils.authRequest('auth/login', formData);
            const isError = tokenResponseData.error;

            Utils.showAlert(tokenResponseData.message, isError, this.alertDiv);

            if (!isError) {
                this.storage.saveTokenCreds(tokenResponseData);

                const userResponseData = await ApiRequestUtils.request("user/info")
                this.storage.saveUserInfo(userResponseData);

                Utils.showAlert(userResponseData.message, userResponseData.error, this.alertDiv);

                setTimeout(() => this.redirect.to_dashboard(), 2000);
            }
        }

        catch (error) {
            console.error('Login error:', error);
            Utils.showAlert('An unexpected error occurred. Please try again.', true, this.alertDiv);
        }

        finally {
            Utils.hideLoader(this.loader);
        }
    }


}

class LoginWithGoogleButtonHandler {
    constructor() {
        this.config = new Config();
        this.button = document.getElementById("login-with-google-button");
        this.loader = document.querySelector('.google-auth-loader');
        this.alertDiv = document.getElementById('alert-box');
        this.button.addEventListener('click', (e) => this.handleButtonClick(e));
    }

    async handleButtonClick(e) {
        e.preventDefault();
        Utils.showLoader(this.loader);

        const redirectUrlResponse = await ApiRequestUtils.authRequest("auth/login/google");
        const isError = redirectUrlResponse.error;


        Utils.showAlert(redirectUrlResponse.message, isError, this.alertDiv);

        if (!isError) {
            window.location.href = redirectUrlResponse.link;
        }

    }


}

class IndexPage{
    static updateTopButton(){
        const config = new Config();
        var element = document.getElementById("index-top-button");
        var linkElement = document.getElementById("index-top-button-link");
        if (Utils.checkLogin()){

            element.innerHTML = "Dashboard";
            linkElement.href = config.localhost ? "/dashboard.html" : "/dashboard"
        }
        else{

            element.innerHTML = "Login";
            linkElement.href = config.localhost ? "/login.html" : "/login"
        }
    }
}

class CategoriesDropdown {
    static update() {
        var categoriesElement = document.getElementById("dashboard-add-entry-categories-list");


        // Making sure to remove all the previously added categories, this way it can be called anywhere without making any duplicate dropdowns.
        categoriesElement.innerHTML = "";
        var userInfo = JSON.parse(localStorage.getItem('userInfo'));
        var userCategories = userInfo.categories;

        try {
            userCategories.forEach(category => {


                categoriesElement.innerHTML += `
                <li class="flex items-center">
                    <input id="${category}" type="checkbox" ${category == 'Daily' ? 'checked' : ''} value="${category}" class="w-4 h-4 bg-gray-100 border-gray-300 rounded text-primary-600 focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500" />
                    
                    <label for="${category}" class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-100">${category}</label>
                </li>
                `
            });
        }

        catch (error) {
            categoriesElement.innerHTML += `
                <li class="flex items-center">
                    <input id="Daily" type="checkbox" value="Daily" checked class="w-4 h-4 bg-gray-100 border-gray-300 rounded text-primary-600 focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500" />
                    
                    <label for="Daily" class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-100">Daily</label>
                </li>
                `
        }


    }
}

class DashboardAddEntryHandler {
    constructor() {
        this.config = new Config();
        this.form = document.getElementById("add-entry-form");
        this.loader = document.querySelector('.add-entry-loader');
        this.alertDiv = document.getElementById('alert-box');
        this.localhost = this.config.localhost;
        this.redirect = new Redirect();
        this.storage = new LocalStorageUtils();
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        CategoriesDropdown.update();
        this.listEntriesHanlder = new ListEntriesHandler();

    }

    async handleSubmit(e) {
        e.preventDefault();
        Utils.showLoader(this.loader);

        const formData = Utils.getFormData('add-entry-form');

        formData.categories = this.getSelectedCategories();

        formData.sharing = document.getElementById('sharing').checked;

        console.log(formData);
        try {
            const responseData = await ApiRequestUtils.request('user/add-entry', formData, 'POST');
            const isError = responseData.error;

            Utils.showAlert(responseData.message, isError, this.alertDiv);

            if (!isError) {
                Utils.closeModal('[data-modal-toggle="add-entry-modal"]');
                this.form.reset();
                this.listEntriesHanlder.refreshEntries();
            }
        }
        catch (error) {
            console.error('Add entry error:', error);
            Utils.showAlert('An unexpected error occurred. Please try again.', true, this.alertDiv);
        }
        finally {
            Utils.hideLoader(this.loader);
        }
    }

    getSelectedCategories() {
        const checkboxes = document.querySelectorAll('#dropdown input[type="checkbox"]:checked');
        return Array.from(checkboxes).map(
            checkbox => checkbox.value
        );
    }




}


class DashboardEditEntryHandler {
    constructor(form, postId) {
        this.config = new Config();
        this.form = form;
        this.loader = this.form.querySelector('.edit-entry-loader');
        this.alertDiv = document.getElementById('alert-box');
        this.localhost = this.config.localhost;
        this.redirect = new Redirect();
        this.storage = new LocalStorageUtils();
        this.postId = postId

        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        }
        this.listEntriesHandler = new ListEntriesHandler();
    }


    async handleSubmit(e) {
        e.preventDefault();
        Utils.showLoader(this.loader);

        const formData = Utils.getFormData(this.form.id);

        formData.categories = this.getSelectedCategories();

        formData.sharing = document.getElementById('sharing').checked;
        formData.postId = this.postId;

        console.log(formData);
        try {
            const responseData = await ApiRequestUtils.request('user/edit-entry', formData, 'POST');
            const isError = responseData.error;

            Utils.showAlert(responseData.message, isError, this.alertDiv);

            if (!isError) {
                Utils.closeModal(`[data-modal-toggle="edit-entry-modal-${this.postId}"]`);
                this.form.reset();
                this.listEntriesHandler.refreshEntries();
            }
        }
        catch (error) {
            console.error('Add entry error:', error);
            Utils.showAlert('An unexpected error occurred. Please try again.', true, this.alertDiv);
        }
        finally {
            Utils.hideLoader(this.loader);
        }
    }

    getSelectedCategories() {
        const checkboxes = document.querySelectorAll('#dropdown input[type="checkbox"]:checked');
        return Array.from(checkboxes).map(
            checkbox => checkbox.value
        );
    }




}

class DashboardAddCategoryHandler {
    constructor() {
        this.config = new Config();
        this.form = document.getElementById("add-category-form");
        this.loader = document.querySelector('.add-category-loader');
        this.alertDiv = document.getElementById('alert-box');
        this.storage = new LocalStorageUtils();
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }


    async updateUserInfo() {
        const userResponseData = await ApiRequestUtils.request("user/info");
        this.storage.saveUserInfo(userResponseData);
        Utils.showAlert(userResponseData.message, userResponseData.error, this.alertDiv);
    }

    async handleSubmit(e) {
        e.preventDefault();
        Utils.showLoader(this.loader);

        const formData = Utils.getFormData('add-category-form');

        try {
            const responseData = await ApiRequestUtils.request('user/add-category', formData, 'POST');
            const isError = responseData.error;

            Utils.showAlert(responseData.message, isError, this.alertDiv);

            if (!isError) {
                Utils.closeModal('[data-modal-toggle="add-category-modal"]');
                this.form.reset();
                await this.updateUserInfo();
                CategoriesDropdown.update();
            }
        }
        catch (error) {
            console.error('Add entry error:', error);
            Utils.showAlert('An unexpected error occurred. Please try again.', true, this.alertDiv);
        }
        finally {
            Utils.hideLoader(this.loader);
            
        }

    }

}


class Profile {
    constructor() {
        this.storage = new LocalStorageUtils();
    }

    updateTop() {
        var usernameElement = document.getElementById("dashboard-username-top")
        var profilePictureElement = document.getElementById("dashboard-profile-picture-top")

        usernameElement.innerHTML = this.storage.getUsername();
        profilePictureElement.src = this.storage.getProfilePicture();
    }

    updateSidebar() {
        var usernameElement = document.getElementById("dashboard-username-sidebar");
        var userIdElement = document.getElementById("dashboard-userid-sidebar");
        var profilePictureElement = document.getElementById("dashboard-profile-picture-sidebar");

        usernameElement.innerHTML = this.storage.getUsername();
        userIdElement.innerHTML = this.storage.getUserId();
        profilePictureElement.src = this.storage.getProfilePicture();
    }
}



class SearchBarHandler {
    constructor() {
        this.searchInput = document.getElementById('topbar-search');
        this.debounceTimeout = null;
        this.listEntriesHanlder = new ListEntriesHandler();
        this.entriesListingHeadingElement = document.getElementById("dashboard-entries-listing-heading");
        this.searchInput.addEventListener('input', async (e) => await this.handleSearch(e))
        this.preventFormSubmit();
    }

    async handleSearch(e) {
        const query = e.target.value;

        if (query == "") {
            this.updateDefaultHeadingText();
        }

        else {
            // Update the heading text to "Search results for query"
            this.updateHeadingText(query);
        }



        clearTimeout(this.debounceTimeout);

        this.debounceTimeout = setTimeout(() => {
            this.listEntriesHanlder.queryEntries(query);
        }, 500);
    }

    removeHeadingText() {
        this.entriesListingHeadingElement.innerHTML = "";
    }

    updateHeadingText(query) {
        this.removeHeadingText();
        this.entriesListingHeadingElement.innerHTML = `Search Results for <i>${query}...</i>`;
    }

    updateDefaultHeadingText() {
        this.removeHeadingText();
        this.entriesListingHeadingElement.innerHTML = "List of your diary entries";
    }

    preventFormSubmit() {
        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key == "enter") {
                e.preventDefault();
            }
        });
    }
}

class ListEntriesHandler {
    constructor() {
        this.tableBody = document.getElementById("main-diary-entries-table-body");
        this.alertDiv = document.getElementById('alert-box');
    }

    async refreshEntries() {
        this.clearTableBody();
        this.showSkeletonLoader();
        const responseData = await ApiRequestUtils.request('user/list-entries');
        this.removeSkeletonLoader();
        this.initTable(responseData.entries);
    }

    async queryEntries(query) {
        this.clearTableBody();
        this.showSkeletonLoader();
        const responseData = await ApiRequestUtils.request(`user/list-entries?query=${query}`)
        this.removeSkeletonLoader();
        console.log(responseData.entries);
        this.initTable(responseData.entries);
    }

    async showEntries() {
        try {

            const responseData = await ApiRequestUtils.request('user/list-entries');
            this.removeSkeletonLoader();
            this.initTable(responseData.entries);
        }

        catch (error) {

            Utils.showAlert("Something went wrong!", true, this.alertDiv);

        }


    }

    initTable(entries) {
        if (entries.length === 0) {
            this.tableBody.innerHTML = '<tr><td colspan="6" class="p-4 text-center font-normal text-gray-900 whitespace-nowrap dark:text-white">No entries found</td></tr>';
            return;
        }
        entries.reverse().forEach(entry => {
            const row = this.createTableRow(entry);
            this.tableBody.appendChild(row);
        });

        this.initializeModals();

    }

    createTableRow(entry) {
        const row = document.createElement('tr');
        row.innerHTML = `
        <td class="p-4 text-sm font-normal text-gray-900 whitespace-nowrap dark:text-white">
                ${entry.title}
            </td>
            <td class="p-4 text-sm font-normal text-gray-500 whitespace-nowrap dark:text-gray-400">
               ${entry.category.join(', ')}
            </td>
            <td class="p-4 text-sm font-normal text-gray-500 whitespace-nowrap dark:text-gray-400">
                 ${Utils.formatDate(entry.created_at)}
            </td>
            <td class="p-4 text-sm font-semibold text-gray-900 whitespace-nowrap dark:text-white">
                ${entry.emoji[0] == undefined ? "-" : entry.emoji[0]}
            </td>
            <td class="p-text-sm font-normal text-gray-500 whitespace-nowrap dark:text-gray-400">
                <div class="flex items-center">
                    <div class="flex pl-2 space-x-1">
                        
                        <button type="button" data-modal-toggle="edit-entry-modal-${entry.post_id}"
                                    class="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-700">
                                    
                                    <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m14.304 4.844 2.852 2.852M7 7H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-4.5m2.409-9.91a2.017 2.017 0 0 1 0 2.853l-6.844 6.844L8 14l.713-3.565 6.844-6.844a2.015 2.015 0 0 1 2.852 0Z"/>
                                    </svg>

                            </button>


                            <button type="button" data-modal-toggle="view-entry-modal-${entry.post_id}"
                                    class="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-700">
                                    
                                    <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                                    <path stroke="currentColor" stroke-width="2" d="M21 12c0 1.2-4.03 6-9 6s-9-4.8-9-6c0-1.2 4.03-6 9-6s9 4.8 9 6Z"/>
                                    <path stroke="currentColor" stroke-width="2" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
                                    </svg>


                            </button>


                            




                    </div>
                </div>
            </td>
            <td class="p-4 whitespace-nowrap">
                <span class="${entry.sharing ? 'bg-green-100 text-green-800 dark:bg-gray-700 dark:text-green-400 border-green-100 dark:border-green-500' : 'bg-red-100 text-red-800 dark:bg-gray-700 dark:text-red-400 border-red-100 dark:border-red-500'} text-xs font-medium mr-2 px-2.5 py-0.5 rounded-md border">
                    ${entry.sharing ? 'Public' : 'Private'}
                </span>
            </td>
        `

        this.createEditModal(entry);
        this.createViewModal(entry);

        this.initializeDashboardEditHandler(entry.post_id);

        return row;
    }

    initializeDashboardEditHandler(postId) {
        const formElement = document.querySelector(`#edit-entry-form-${postId}`);
        if (formElement) {
            new DashboardEditEntryHandler(formElement, postId);
        }
    }

    
    
    
    createViewModal(entry) {
        const modalId = `view-entry-modal-${entry.post_id}`;
        let modal = document.getElementById(modalId);
    
        // Split the description by \n and wrap each part in <p> tags
        const formattedDescription = entry.description
            .split('\n')
            .map(paragraph => `<p class="text-base leading-relaxed text-gray-500 dark:text-gray-400">${paragraph}</p>`)
            .join('');
    
        

        

        

        try{
            // Update existing modal content
            modal.querySelector('h3').innerHTML = `${entry.title} - ${entry.emoji.join(' ')}`;
            modal.querySelector('.p-6').innerHTML = formattedDescription;
        }
        catch(error){

                // Create a new modal if it doesn't exist
                modal = document.createElement('div');
                modal.id = modalId;
                modal.className = "fixed left-0 right-0 z-50 items-center justify-center hidden overflow-x-hidden overflow-y-auto top-4 md:inset-0 h-modal sm:h-full";

                modal.innerHTML = `
                    <div class="relative w-full h-full max-w-2xl px-4 md:h-auto">
                        <div class="relative bg-white rounded-lg shadow dark:bg-gray-800">
                            <div class="flex items-start justify-between p-5 border-b rounded-t dark:border-gray-700">


                                <div class="flex justify-between items-center" bis_size="{&quot;x&quot;:48,&quot;y&quot;:460,&quot;w&quot;:525,&quot;h&quot;:28,&quot;abs_x&quot;:64,&quot;abs_y&quot;:1066}">
                                    <div class="flex items-center space-x-4" bis_size="{&quot;x&quot;:48,&quot;y&quot;:460,&quot;w&quot;:121,&quot;h&quot;:28,&quot;abs_x&quot;:64,&quot;abs_y&quot;:1066}">
                                        <img class="w-7 h-7 rounded-full" src="" id = "view-entry-profile-photo" alt="avatar" bis_size="{&quot;x&quot;:48,&quot;y&quot;:460,&quot;w&quot;:28,&quot;h&quot;:28,&quot;abs_x&quot;:64,&quot;abs_y&quot;:1066}">
                                        <span class="font-medium dark:text-white" bis_size="{&quot;x&quot;:92,&quot;y&quot;:462,&quot;w&quot;:77,&quot;h&quot;:24,&quot;abs_x&quot;:108,&quot;abs_y&quot;:1068}">
                                            <b>${entry.title}</b>
                                        </span>
                                    </div>
                                

                                </div>

                                
                                <button type="button"
                                    class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-700 dark:hover:text-white"
                                    data-modal-target="${modalId}" data-modal-toggle="${modalId}">
                                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"
                                        xmlns="http://www.w3.org/2000/svg">
                                        <path fill-rule="evenodd"
                                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414z"
                                            clip-rule="evenodd"></path>
                                    </svg>
                                </button>
                            </div>
                            <div class="p-6 space-y-6">
                                ${formattedDescription}
                            </div>
                        </div>
                    </div>`;

                document.body.appendChild(modal);

                }
                    
            
       

        // Update the profile photo

        var viewEntryProfilePhoto = document.getElementById("view-entry-profile-photo");
        viewEntryProfilePhoto.src = new LocalStorageUtils().getProfilePicture();

    }
    
    

    createEditModal(entry) {
        const existingModal = document.getElementById(`edit-entry-modal-${entry.post_id}`);
        
        if (existingModal) {
            // Update the content of the existing modal
            const titleElement = existingModal.querySelector('h3');
            titleElement.textContent = `Edit Entry - ${entry.title}`;
    
            const titleInput = existingModal.querySelector(`#edit-entry-form-${entry.post_id} input[name="title"]`);
            titleInput.value = entry.title;
    
            const slugInput = existingModal.querySelector(`#edit-entry-form-${entry.post_id} input[name="slug"]`);
            slugInput.value = entry.slug;
    
            const emojiInput = existingModal.querySelector(`#edit-entry-form-${entry.post_id} input[name="emoji"]`);
            emojiInput.value = entry.emoji.join(' ');
    
            const sharingInput = existingModal.querySelector(`#edit-entry-form-${entry.post_id} input[name="sharing"]`);
            sharingInput.checked = entry.sharing;
    
            const descriptionInput = existingModal.querySelector(`#edit-entry-form-${entry.post_id} textarea[name="description"]`);
            descriptionInput.value = entry.description;
            
        } else {
            // Create a new modal if it doesn't exist
            const modal = document.createElement('div');
            modal.id = `edit-entry-modal-${entry.post_id}`;
            modal.className = "fixed left-0 right-0 z-50 items-center justify-center hidden overflow-x-hidden overflow-y-auto top-4 md:inset-0 h-modal sm:h-full";
            modal.innerHTML = `
                <div class="relative w-full h-full max-w-2xl px-4 md:h-auto">
                    <div class="relative bg-white rounded-lg shadow dark:bg-gray-800">
                        <div class="flex items-start justify-between p-5 border-b rounded-t dark:border-gray-700">
                            <h3 class="text-xl font-semibold dark:text-white">
                                Edit Entry - ${entry.title}
                            </h3>
                            <button type="button"
                                class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-700 dark:hover:text-white"
                                data-modal-target="edit-entry-modal-${entry.post_id}" data-modal-toggle="edit-entry-modal-${entry.post_id}">
                                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <path fill-rule="evenodd"
                                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414z"
                                        clip-rule="evenodd"></path>
                                </svg>
                            </button>
                        </div>
                        <div class="p-6 space-y-6">
                            <form id="edit-entry-form-${entry.post_id}" action="#">
                                <div class="grid grid-cols-6 gap-6">
                                    <div class="col-span-6">
                                        <label for="title"
                                            class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Title</label>
                                        <input type="text" name="title" id="title"
                                            class="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" value="${entry.title}" required>
                                    </div>
                                    <div class="col-span-2">
                                        <label for="slug"
                                            class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Slug</label>
                                        <input type="text" name="slug" id="slug"
                                            class="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                                            autocomplete="off" value="${entry.slug}">
                                    </div>
                                    <div class="col-span-2">
                                        <label for="emoji"
                                            class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Emoji</label>
                                        <input type="text" name="emoji" id="emoji"
                                            class="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                                            value="${entry.emoji.join(' ')}" autocomplete="off">
                                    </div>
                                    <div class="col-span-2">
                                        <label for="sharing"
                                            class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Sharing</label>
                                        <input type="checkbox" name="sharing" id="sharing"
                                            class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" ${entry.sharing ? "checked" : ""}>
                                    </div>
                                    <div class="col-span-6">
                                        <label for="description"
                                            class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Description</label>
                                        <textarea id="description" name="description" rows="4"
                                            class="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500">${entry.description}</textarea>
                                    </div>
                                </div>
                                <br />
                                <div class="col-span-6">
                                    <button type="submit"
                                        class="text-white bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800">
                                        Edit Entry
                                        <div class="edit-entry-loader" style="display: none;"></div>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>`;
            
            document.body.appendChild(modal);
        }
    }


    

    

    initializeModals() {
        const modalToggles = document.querySelectorAll('[data-modal-toggle]');
    
        modalToggles.forEach(toggle => {
            const modalId = toggle.getAttribute('data-modal-toggle');
    
            // We want this initializeModals only for our edit entry modals
            if (modalId.includes("edit-entry") || modalId.includes("view-entry")) {
                const modalElement = document.getElementById(modalId);
                if (modalElement) {
                    const modalInstance = new Modal(modalElement);
    
                    // Show the modal when the toggle is clicked
                    toggle.addEventListener('click', () => {
                        modalInstance.show();
                        
                    });
    
                    // Close the modal when the close button is clicked
                    const closeButton = modalElement.querySelector('button[data-modal-toggle]');
                    if (closeButton) {
                        closeButton.addEventListener('click', () => {
                            modalInstance.hide();
                        });
                    }

                }
            }
        });
    }
    



    removeSkeletonLoader() {
        this.tableBody.innerHTML = "";
    }

    showSkeletonLoader() {
        this.tableBody.innerHTML = `
        <tr class="animate-pulse">
            <td colspan="6" class="p-4">
                <div
                    class="h-3.5 bg-gray-300 rounded-full dark:bg-gray-600 w-full">
                </div>
            </td>

        </tr>
        <tr class="animate-pulse">
            <td colspan="6" class="p-4">
                <div
                    class="h-3.5 bg-gray-300 rounded-full dark:bg-gray-600 w-full">
                </div>
            </td>

        </tr>
        <tr class="animate-pulse">
            <td colspan="6" class="p-4">
                <div
                    class="h-3.5 bg-gray-300 rounded-full dark:bg-gray-600 w-full">
                </div>
            </td>

        </tr>
        `
    }

    clearTableBody() {
        this.tableBody.innerHTML = "";
    }

}



class StreakHandler{
    constructor(){
        this.streakCountElement = document.getElementById('dashboard-streak-count');
        this.button = document.getElementById("check-in-streak-button");
        this.loader = document.querySelector('.add-streak-loader');
        this.alertDiv = document.getElementById('alert-box');
        this.button.addEventListener("click", (e) => this.handleCheckInButtonClick(e))
    }

    clearStreakCount(){
        this.streakCountElement.innerHTML = "";
    }

    async updateCount(){
        const responseData = await ApiRequestUtils.request("streak/check");
        this.clearStreakCount();
        this.streakCountElement.innerHTML = responseData.available_streaks + "🔥";
    }

    async handleCheckInButtonClick(e){
        e.preventDefault();
        Utils.showLoader(this.loader);

        const response = await ApiRequestUtils.request("streak/add");
        const isError = response.error;

        

        if (!isError){
            Utils.showAlert(response.message, isError, this.alertDiv);
            
            Utils.closeModal('[data-modal-toggle="daily-check-in-modal"]');
            this.updateCount();
        }

        else{
            Utils.showAlert(response.message, isError, this.alertDiv);
            Utils.closeModal('[data-modal-toggle="daily-check-in-modal"]');
        }

        Utils.hideLoader(this.loader);

    }
}