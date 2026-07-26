// Library Imports
import { GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { Anchor, Button, Divider, Group, LoadingOverlay, Paper, PasswordInput, SegmentedControl, Stack, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';

// API Imports
import { auth } from '../api/firebase';

// Component Imports
import { upperFirst } from '@mantine/hooks';
import { notifFail, notifSuccess } from '../components/Notifications';
import { User } from '../api/db/dbUser.ts';
import { Invoice } from '../api/db/dbInvoice.ts';
import { BackgroundBeams } from '../components/ui/background-beams.tsx';


// const GoogleIcon = () => <img src="https://img.icons8.com/color/48/000000/google-logo.png" alt="Google Logo" style={{ width: 30, aspectRatio: "1/1", marginRight: 10, userSelect: "none" }} />

export default function Login() {
  
  /** Handle sign in with Google auth provider */
  async function signIn() {
    // Sign in with Google
    return new Promise((resolve, reject) => {
      signInWithPopup(auth, new GoogleAuthProvider()).then((result) => {
        setLoading(true); resolve(result);  }).catch((error) => { console.error(error); setLoading(false) })
    })
  }

  const form = useForm({
    initialValues: {
      email: '',
      name: '',
      password: '',
      role: "",
    },

    validate: {
      email: (val) => (/^\S+@\S+$/.test(val) ? null : 'Invalid email'),
      password: (val) => (val.length <= 6 ? 'Password should include at least 6 characters' : null),
      role: (val) => ((val.length === 0 && type === "register") ? 'Please select a role' : null),
      name: (val) => ((val.length === 0 && type === "register") ? 'Please enter your name' : null),
    },
  });

  const [loading, setLoading] = useState(true)
  const [invoiceRedirect, setInvoiceRedirect] = useState(null)

  useEffect(() => {
    auth.authStateReady().then(() => setLoading(false))
    
    // Check if there's an invoice ID in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const invoiceId = urlParams.get('invoice');
    if (invoiceId) {
      setInvoiceRedirect(invoiceId);
    }
  }, [])

  const [type, setType] = useState('login')
  
  return (
    
    <div className='relative antialiased d-flex flex-column align-items-center justify-content-center vh-100 bg-gray-1'>
      <BackgroundBeams />
      <LoadingOverlay visible={loading} />
      {/* {loading && <Text mb="1rem">Attempting to log you in...</Text>} */}
      <Paper radius="md" p="xl" withBorder className="bg-light-platform" style={{zIndex: 2}}>
      <Text size="lg" fw={500}>
        {invoiceRedirect ? 
          `Create an account to view your invoice` : 
          `Welcome to A New Day Coaching, ${type} with`
        }
      </Text>
      {invoiceRedirect && (
        <Text size="sm" c="dimmed" mt="xs">
          You've been sent a payment link. Create an account or sign in to continue.
        </Text>
      )}

      <Group grow mb="md" mt="md">
        <GoogleButton radius="xl" onClick={signIn}>Google</GoogleButton>
      </Group>

      <Divider label="Or continue with email" labelPosition="center" my="lg" />

      <form onSubmit={form.onSubmit(
          (values, event) => {
            setLoading(true)
            if (type === "login") {
              signInWithEmailAndPassword(auth, values.email, values.password).then((userCredential) => {
                User.getById(userCredential.user.uid).then((dbUser) => { 
                  notifSuccess("Login Success", "Welcome back, " + dbUser.personalData.displayName);
                  
                  // If there's an invoice to redirect to, go there
                  if (invoiceRedirect) {
                    window.location.hash = `#invoices?invoice=${invoiceRedirect}`;
                  }
                });
              }).catch((error) => {
                if (error.code === 'auth/user-not-found') {
                  notifFail("Login Error", 'User not found');
                  setLoading(false)
                } else if (error.code === 'auth/invalid-credential') {
                  notifFail("Login Error", 'Email / password is invalid.');
                  setLoading(false)
                }
              });
            } else {
              createUserWithEmailAndPassword(auth, values.email, values.password).then((userCredential) => {
                const dbUser = User.getInstanceById(userCredential.user.uid)
                dbUser.personalData.displayName = values.name
                dbUser.personalData.role = values.role
                dbUser.personalData.email = values.email
                dbUser.personalData.pfpUrl = "https://www.gravatar.com/avatar/" + Math.floor(Math.random() * 1000000) + "?d=identicon"
                dbUser.setData().then((user) => {
                  notifSuccess("Registration Success", "Welcome to A New Day Coaching, " + values.name);
                  
                  // If there's an invoice to link, do it now
                  if (invoiceRedirect) {
                    Invoice.linkToUser(invoiceRedirect, userCredential.user.uid).then((success) => {
                      if (success) {
                        // Redirect to invoices page with the invoice ID
                        window.location.hash = `#invoices?invoice=${invoiceRedirect}`;
                      }
                    });
                  }
                })
              }).catch((error) => {
                if (error.code === 'auth/email-already-in-use') {
                  notifFail("Resigtration Error", 'Email already in use');
                  setLoading(false)
                } else {
                  notifFail("Registration Error", "There was an unknown issue signing you in: " + error.code + " - " + error.message);
                  setLoading(false)
                }
              });
            }
          }
        )}>
        <Stack>
          {type === 'register' && (
            <TextInput
              label="Name"
              required
              placeholder="Your name"
              value={form.values.name}
              onChange={(event) => form.setFieldValue('name', event.currentTarget.value)}
              radius="md"
            />
          )}

          <TextInput
            required
            label="Email"
            placeholder="hello@joed.dev"
            value={form.values.email}
            onChange={(event) => form.setFieldValue('email', event.currentTarget.value)}
            error={form.errors.email && 'Invalid email'}
            radius="md"
          />

          <PasswordInput
            required
            label="Password"
            placeholder="Your password"
            value={form.values.password}
            onChange={(event) => form.setFieldValue('password', event.currentTarget.value)}
            error={form.errors.password && 'Password should include at least 6 characters'}
            radius="md"
          />

          {type === 'register' && (
            <div className="d-flex flex-column gap-2 w-100 justify-content-center align-items-start">
              <Text size="sm" fw={500}>
                My role<span class="m_78a94662 mantine-InputWrapper-required mantine-TextInput-required" aria-hidden="true"> *</span>
              </Text>
              <SegmentedControl
                w="100%"
                data={['Student', 'Parent', 'Other']}
                value={form.values.role}
                onChange={(value) => form.setFieldValue('role', value)}
              />
            </div>
          )}
        </Stack>

        <Group justify="space-between" mt="xl">
          <Anchor component="button" type="button" c="dimmed" onClick={() => type === "register" ? setType('login') : setType('register')} size="xs">
            {type === 'register'
              ? 'Already have an account? Login'
              : "Don't have an account? Register"}
          </Anchor>
          <Button type="submit" disabled={!form.isValid()} radius="xl">
            {upperFirst(type)}
          </Button>
        </Group>
      </form>
    </Paper>
    </div>
  )
}

function GoogleIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid"
      viewBox="0 0 256 262"
      style={{ width: '0.9rem', height: '0.9rem' }}
      {...props}
    >
      <path
        fill="#4285F4"
        d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
      />
      <path
        fill="#34A853"
        d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
      />
      <path
        fill="#FBBC05"
        d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782"
      />
      <path
        fill="#EB4335"
        d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
      />
    </svg>
  );
}

function GoogleButton(props) {
  return <Button className="google-button" leftSection={<GoogleIcon />} variant="default" {...props} />;
}
