import React from 'react';
import { Phone, Video, MoreHorizontal, User, Trash2, CheckCircle2, XCircle, Search, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import Link from 'next/link';
import type { EnrichedMetaConversation } from '@/hooks/useEnrichedMetaConversations';
import { cn } from '@/lib/utils';

interface ChatHeaderProps {
    conversation: EnrichedMetaConversation;
    isWhatsAppConnected: boolean | null;
    onDelete: () => void;
    onBack?: () => void;
}

export function ChatHeader({ conversation, isWhatsAppConnected, onDelete, onBack }: ChatHeaderProps) {
    const contactName = conversation.contactName || conversation.customerName || conversation.customerPhone;

    return (
        <div className="h-[70px] bg-white border-b border-gray-100 px-4 md:px-6 flex items-center justify-between shrink-0 shadow-[0_1px_2px_0_rgba(0,0,0,0.02)] z-10">
            <div className="flex items-center gap-2 md:gap-3">
                {/* Mobile Back Button - More prominent */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden -ml-2 h-10 w-10 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-full transition-colors active:scale-95"
                    onClick={onBack}
                >
                    <ChevronLeft className="w-6 h-6" />
                </Button>

                <Avatar className="w-9 h-9 md:w-10 md:h-10 border border-gray-100 shadow-sm">
                    <AvatarImage src={conversation.contact?.avatarUrl} />
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-medium text-xs">
                        {contactName?.[0]?.toUpperCase()}
                    </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <h2 className="font-semibold text-gray-900 text-[15px] leading-tight tracking-tight truncate max-w-[140px] md:max-w-xs">
                            {contactName}
                        </h2>
                        {conversation.contactCompany && (
                            <span className="text-[10px] md:text-[11px] text-gray-400 truncate max-w-[80px] md:max-w-none hidden sm:inline">
                                · {conversation.contactCompany}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-0.5">
                        <div className="flex items-center gap-1">
                            {isWhatsAppConnected ? (
                                <CheckCircle2 className="w-3 h-3 text-green-500" />
                            ) : (
                                <XCircle className="w-3 h-3 text-red-500" />
                            )}
                            <span className="hidden md:inline font-medium">WhatsApp</span>
                        </div>
                        <span className="text-gray-300 hidden sm:inline">•</span>
                        <span className="font-mono text-gray-400 text-[10px] md:text-[11px] hidden sm:inline">{conversation.customerPhone}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="hidden md:flex text-gray-400 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-full transition-colors w-8 h-8">
                    <Search className="w-4 h-4" />
                </Button>
                <div className="hidden md:block h-5 w-px bg-gray-100 mx-1" />
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-full transition-colors w-9 h-9">
                    <Phone className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="hidden md:flex text-gray-400 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-full transition-colors w-9 h-9">
                    <Video className="w-4.5 h-4.5" />
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full w-9 h-9">
                            <MoreHorizontal className="w-4.5 h-4.5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 text-[13px]">
                        {conversation.contact ? (
                            <DropdownMenuItem asChild>
                                <Link href={`/partner/contacts?search=${conversation.customerPhone}`} className="flex items-center cursor-pointer">
                                    <User className="w-3.5 h-3.5 mr-2" />
                                    View Full Profile
                                </Link>
                            </DropdownMenuItem>
                        ) : (
                            <DropdownMenuItem asChild>
                                <Link
                                    href={`/partner/contacts/new?phone=${conversation.customerPhone}&name=${conversation.customerName || ''}`}
                                    className="flex items-center cursor-pointer"
                                >
                                    <User className="w-3.5 h-3.5 mr-2" />
                                    Add to Contacts
                                </Link>
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={onDelete} className="text-red-600 focus:text-red-600 cursor-pointer focus:bg-red-50">
                            <Trash2 className="w-3.5 h-3.5 mr-2" />
                            Delete Conversation
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
