'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, Lock, User, ArrowRight, Sparkles, Ticket, Mail } from 'lucide-react';

export default function LoginPage() {
  const [isNewUser, setIsNewUser] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [invitationCode, setInvitationCode] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login, register, isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isNewUser) {
        await register(username, password, invitationCode, email);
      } else {
        await login(username, password);
      }
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Credenciales inválidas');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsNewUser(!isNewUser);
    setError('');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden dark">
      <div className="absolute inset-0 bg-background" />

      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-primary/10 via-transparent to-transparent rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-chart-2/10 via-transparent to-transparent rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>

      <div className="absolute inset-0">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-chart-2 mb-6 glow-emerald">
            <Wallet className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            <span className="text-gradient">Cash</span>
            <span className="text-foreground">Mind</span>
          </h1>
          <p className="text-muted-foreground flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Tu mente financiera personal
            <Sparkles className="w-4 h-4 text-primary" />
          </p>
        </div>

        <Card className="glass border-border/50 glow-emerald">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">
              {isNewUser ? 'Crear cuenta' : 'Bienvenido'}
            </CardTitle>
            <CardDescription>
              {isNewUser
                ? 'Ingresa tu código de invitación para registrarte'
                : 'Ingresa tus credenciales para continuar'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isNewUser && (
                <div className="space-y-2">
                  <Label htmlFor="invitationCode" className="text-sm font-medium">
                    Código de invitación
                  </Label>
                  <div className="relative">
                    <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="invitationCode"
                      type="text"
                      value={invitationCode}
                      onChange={(e) => setInvitationCode(e.target.value)}
                      className="pl-10 bg-secondary/50 border-border/50 focus:border-primary focus:ring-primary/20 transition-all"
                      placeholder="Tu código de invitación"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">
                  Usuario
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 bg-secondary/50 border-border/50 focus:border-primary focus:ring-primary/20 transition-all"
                    placeholder={isNewUser ? 'Elige tu usuario' : 'Ingresa tu usuario'}
                    required
                  />
                </div>
              </div>

              {isNewUser && (
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email <span className="text-muted-foreground">(opcional)</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-secondary/50 border-border/50 focus:border-primary focus:ring-primary/20 transition-all"
                      placeholder="tu@email.com"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-secondary/50 border-border/50 focus:border-primary focus:ring-primary/20 transition-all"
                    placeholder={isNewUser ? 'Mínimo 6 caracteres' : 'Ingresa tu contraseña'}
                    minLength={isNewUser ? 6 : undefined}
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-primary to-chart-2 hover:opacity-90 text-primary-foreground font-semibold py-6 transition-all duration-300 group"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <>
                    {isNewUser ? 'Crear cuenta' : 'Iniciar Sesión'}
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {isNewUser
                    ? '¿Ya tienes cuenta? Inicia sesión'
                    : '¿Tienes un código de invitación? Regístrate'}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-muted-foreground text-xs mt-6">
          Gestiona tus finanzas con inteligencia
        </p>
      </div>
    </div>
  );
}
