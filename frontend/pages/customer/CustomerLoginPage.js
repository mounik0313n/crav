const CustomerLoginPage = {
    template: `
        <div class="login-container">
            <div class="card login-card">
                <div class="card-body">
                    <div class="text-center mb-4">
                        <h3 class="card-title">Welcome Back!</h3>
                        <p class="text-muted">Sign in to continue to Foodle</p>
                    </div>
                    
                    <form @submit.prevent="handleLogin">
                        <div v-if="error" class="alert alert-danger">{{ error }}</div>

                        <div class="form-group">
                            <label for="email">Email Address</label>
                            <input type="email" 
                                   class="form-control" 
                                   id="email" 
                                   v-model="email"
                                   placeholder="Enter your email" 
                                   required>
                        </div>

                        <div class="form-group">
                            <label for="password">Password</label>
                            <input type="password" 
                                   class="form-control" 
                                   id="password" 
                                   v-model="password"
                                   placeholder="Enter your password" 
                                   required>
                        </div>
                        
                        <div class="text-right mb-4">
                            <a href="#" class="small">Forgot Password?</a>
                        </div>

                        <button type="submit" class="btn btn-brand btn-block">Login</button>
                    </form>

                    <div class="separator mt-4 mb-4">
                        <span>OR</span>
                    </div>

                    <!-- Google Sign-In Button -->
                    <div id="google-signin-btn" class="d-flex justify-content-center"></div>

                    <p class="text-center small mt-4">
                        Don't have an account? 
                        <router-link to="/register">Sign Up</router-link>
                    </p>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            email: '',
            password: '',
            error: null,
            // Replace this with your actual Google Client ID
            googleClientId: '687400550130-e5010qm1elba5jpvlu2a0ice199up4l7.apps.googleusercontent.com',
        };
    },
    mounted() {
        this.initGoogleSignIn();
    },
    methods: {
        initGoogleSignIn() {
            if (typeof google === 'undefined') {
                setTimeout(this.initGoogleSignIn, 500);
                return;
            }

            google.accounts.id.initialize({
                client_id: this.googleClientId,
                callback: this.handleGoogleCallback,
                cancel_on_tap_outside: false,
                context: 'signin',
            });

            google.accounts.id.renderButton(
                document.getElementById('google-signin-btn'),
                { theme: 'outline', size: 'large', width: '100%', text: 'signin_with' }
            );

            // Trigger One Tap if you want
            // google.accounts.id.prompt();
        },

        async handleGoogleCallback(response) {
            this.error = null;
            try {
                const res = await fetch('/api/google-login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: response.credential }),
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.message || 'Google login failed.');
                }

                this.$store.commit('SET_TOKEN', data.token);
                this.$store.commit('SET_USER', data.user);

                // Redirect based on roles (same logic as handleLogin)
                const userRoles = this.$store.getters.userRoles;
                if (userRoles.includes('admin')) {
                    this.$router.push('/admin/dashboard');
                } else if (userRoles.includes('owner')) {
                    this.$router.push('/restaurant/dashboard');
                } else {
                    this.$router.push('/');
                }

            } catch (error) {
                this.error = error.message;
                console.error('Google Login Error:', error);
            }
        },

        async handleLogin() {
            this.error = null;
            try {
                // Call the central login action from the Vuex store
                await this.$store.dispatch('login', {
                    email: this.email,
                    password: this.password,
                });

                // --- THIS IS THE FIX ---
                // After successful login, check the user's roles and redirect accordingly.
                const userRoles = this.$store.getters.userRoles;

                if (userRoles.includes('admin')) {
                    this.$router.push('/admin/dashboard');
                } else if (userRoles.includes('owner')) {
                    this.$router.push('/restaurant/dashboard');
                } else {
                    // Default redirect for customers or if no specific role matches
                    this.$router.push('/');
                }

            } catch (error) {
                // If the store action throws an error, display it
                this.error = error.message;
            }
        },
    },
};

export default CustomerLoginPage;

