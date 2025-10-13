"use client";

import React from 'react';
import Link from 'next/link';
import { Brain, Mail, Github, Twitter, Linkedin, Heart } from 'lucide-react';

const Footer: React.FC = () => {
    return (
        <footer className="bg-gray-50 border-t border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Logo et description */}
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center space-x-2 mb-4">
                            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                                <Brain className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-gray-900">Révisia</span>
                        </div>
                        <p className="text-gray-600 mb-4 max-w-md">
                            Transformez vos documents en questions QCM personnalisées avec l&apos;IA.
                            Optimisez vos révisions et améliorez vos performances d&apos;apprentissage.
                        </p>
                        <div className="flex space-x-4">
                            <a
                                href="mailto:pierre.forques@viacesi.fr"
                                className="text-gray-400 hover:text-orange-500 transition-colors"
                                aria-label="Email"
                            >
                                <Mail className="w-5 h-5" />
                            </a>
                            <a
                                href="https://github.com"
                                className="text-gray-400 hover:text-orange-500 transition-colors"
                                aria-label="GitHub"
                            >
                                <Github className="w-5 h-5" />
                            </a>
                            <a
                                href="https://twitter.com"
                                className="text-gray-400 hover:text-orange-500 transition-colors"
                                aria-label="Twitter"
                            >
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a
                                href="https://linkedin.com"
                                className="text-gray-400 hover:text-orange-500 transition-colors"
                                aria-label="LinkedIn"
                            >
                                <Linkedin className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Liens rapides */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                            Liens rapides
                        </h3>
                        <ul className="space-y-2">
                            <li>
                                <Link
                                    href="/"
                                    className="text-gray-600 hover:text-orange-600 transition-colors"
                                >
                                    Accueil
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/dashboard"
                                    className="text-gray-600 hover:text-orange-600 transition-colors"
                                >
                                    Dashboard
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/login"
                                    className="text-gray-600 hover:text-orange-600 transition-colors"
                                >
                                    Connexion
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/register"
                                    className="text-gray-600 hover:text-orange-600 transition-colors"
                                >
                                    Inscription
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                            Support
                        </h3>
                        <ul className="space-y-2">
                            <li>
                                <a
                                    href="mailto:pierre.forques@viacesi.fr"
                                    className="text-gray-600 hover:text-orange-600 transition-colors"
                                >
                                    Contact
                                </a>
                            </li>
                            <li>
                                <Link
                                    href="/privacy"
                                    className="text-gray-600 hover:text-orange-600 transition-colors"
                                >
                                    Confidentialité
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/terms"
                                    className="text-gray-600 hover:text-orange-600 transition-colors"
                                >
                                    Conditions d&apos;utilisation
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Copyright */}
                <div className="mt-8 pt-8 border-t border-gray-200">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <p className="text-gray-500 text-sm">
                            © 2024 Révisia. Tous droits réservés.
                        </p>
                        <p className="text-gray-500 text-sm mt-2 md:mt-0 flex items-center">
                            Fait avec <Heart className="w-4 h-4 text-red-500 mx-1" /> en France
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
