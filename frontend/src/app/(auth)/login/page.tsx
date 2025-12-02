'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GoldParticles, GoldGradientOrbs } from '@/components/ui/gold-particles';
import { Wallet, Lock, User, ArrowRight, Ticket, Mail } from 'lucide-react';

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
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[#0a0a0c]" />

      <GoldGradientOrbs />
      <GoldParticles count={25} />

      <div className="relative z-10 w-full max-w-[380px] px-6">
        <div
          className="text-center mb-10 animate-fade-in-up"
          style={{ animationDelay: '0.1s' }}
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-gold mb-6">
            <Wallet className="w-8 h-8 text-[#0a0a0c]" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">
            <span className="text-gradient-gold">Cash</span>
            <span className="text-foreground">Mind</span>
          </h1>
          <p className="text-muted-foreground text-sm tracking-wide">
            Tu mente financiera personal
          </p>
        </div>

        <div
          className="glass rounded-2xl p-8 animate-fade-in-up"
          style={{ animationDelay: '0.2s' }}
        >
          <div className="text-center mb-6">
            <h2 className="text-lg font-medium text-foreground mb-1">
              {isNewUser ? 'Crear cuenta' : 'Bienvenido'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isNewUser
                ? 'Ingresa tu código de invitación'
                : 'Ingresa tus credenciales'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isNewUser && (
              <div className="space-y-2">
                <Label
                  htmlFor="invitationCode"
                  className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  Código de invitación
                </Label>
                <div className="relative">
                  <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="invitationCode"
                    type="text"
                    value={invitationCode}
                    onChange={(e) => setInvitationCode(e.target.value)}
                    className="pl-10 h-11 bg-[#12121a] border-[rgba(255,255,255,0.06)] focus:border-primary/50 focus:ring-0 transition-colors"
                    placeholder="Tu código de invitación"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label
                htmlFor="username"
                className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                Usuario
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 h-11 bg-[#12121a] border-[rgba(255,255,255,0.06)] focus:border-primary/50 focus:ring-0 transition-colors"
                  placeholder={isNewUser ? 'Elige tu usuario' : 'Ingresa tu usuario'}
                  required
                />
              </div>
            </div>

            {isNewUser && (
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  Email{' '}
                  <span className="text-muted-foreground/60 normal-case">(opcional)</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 bg-[#12121a] border-[rgba(255,255,255,0.06)] focus:border-primary/50 focus:ring-0 transition-colors"
                    placeholder="tu@email.com"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                Contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-11 bg-[#12121a] border-[rgba(255,255,255,0.06)] focus:border-primary/50 focus:ring-0 transition-colors"
                  placeholder={isNewUser ? 'Mínimo 6 caracteres' : 'Ingresa tu contraseña'}
                  minLength={isNewUser ? 6 : undefined}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="py-2.5 px-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 gradient-gold text-[#0a0a0c] font-medium hover:opacity-90 transition-opacity group"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-[#0a0a0c]/30 border-t-[#0a0a0c] rounded-full animate-spin" />
              ) : (
                <>
                  {isNewUser ? 'Crear cuenta' : 'Iniciar Sesión'}
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
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
        </div>

        <p
          className="text-center text-muted-foreground/50 text-xs mt-8 tracking-wide animate-fade-in"
          style={{ animationDelay: '0.4s' }}
        >
          Gestiona tus finanzas con inteligencia
        </p>
      </div>
    </div>
  );
}
