import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, Validators } from '@angular/forms';
import { ValidationService } from '../../services/validation.service';
import { RestService } from '../../services/rest.service';
import { TokenStorageService } from '../../services/token-storage.service';
import { SocialAuthService } from 'angularx-social-login';
import { GoogleLoginProvider } from 'angularx-social-login';
import { SnackBarService } from '../../services/snackbar.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
    loginForm: any;
    loader = false;
    user: any;

    // tslint:disable-next-line: max-line-length
    constructor(private snackBarService: SnackBarService, private tokenStorage: TokenStorageService, private authService: SocialAuthService, private restService: RestService, private formBuilder: FormBuilder, private router: Router) {
        this.loginForm = this.formBuilder.group({
            businessEmail: ['', [Validators.required, ValidationService.emailValidator]],
            password: ['', [Validators.required]]
        });
    }

    /**
     *  Function to Initiate component.
     */
    ngOnInit(): void {
      // Function to Subscribe to the authentication state.
      // Receive a SocialUser object when the user logs in and a null when the user logs out.
      this.authService.authState.subscribe((user) => {
            this.user = user;
        });
    }

    /**
     *  Function to Sign-in with GoogleLoginProvider.
     */
    signInWithGoogle(): void {
        this.authService.signIn(GoogleLoginProvider.PROVIDER_ID).then(user => {
            this.loader = true;
            this.restService.postData('users/get-auth-token', user)
                .subscribe(
                    response => {
                        if (response && response.success) {
                            this.tokenSuccessHandler(response);
                        }
                        this.loader = false;
                    },
                    error => {
                        this.snackBarService.openSnackBar(error.error.message, '');
                        this.loader = false;
                        if (error.error && error.error.redirect === 'sign-up') {
                            this.router.navigateByUrl('/sign-up');
                        }
                    });
        });
    }

    /**
     * Function to signout.
     */
    signOut(): void {
        this.authService.signOut();
    }

    /**
     * Function to validate and login the user.
     */
    login(): void {
        if (this.loginForm.dirty && this.loginForm.valid) {
            this.loader = true;
            this.restService.postData('users/login', this.loginForm.value)
                .subscribe(
                    response => {
                        if (response && response.success) {
                            this.tokenSuccessHandler(response);
                        }
                        this.loader = false;
                    },
                    error => {
                        this.snackBarService.openSnackBar(error.error.message, '');
                        this.loader = false;
                    });
        }
    }

    /**
     * Function to save user information and auth token.
     * @param  response contains user profile and auth token
     */
    tokenSuccessHandler(response): void {
        this.tokenStorage.saveToken(response.authToken);
        this.tokenStorage.saveUser(response.userInfo);
        this.snackBarService.openSnackBar(response.message, '');
    }
}

