import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { X, Trash2 } from 'lucide-react';

interface PhoneNumberManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (phoneNumber: string) => void;
  onEntriesChange: (entries: { phone: string }[]) => void;
}

export function PhoneNumberManager({ open, onOpenChange, onSelect, onEntriesChange }: PhoneNumberManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newEntry, setNewEntry] = useState({
    phone: '',
    name: '',
    id: '',
    apiKey: '',
  });
  const [errors, setErrors] = useState({
    phone: false,
    id: false,
    apiKey: false,
  });
  const [entries, setEntries] = useState([
    {
      phone: process.env.NEXT_PUBLIC_ALIGO_SENDER || '',
      name: '기본 발신번호',
      id: process.env.NEXT_PUBLIC_ALIGO_USER_ID || '',
      apiKey: process.env.NEXT_PUBLIC_ALIGO_API_KEY || '',
    },
  ]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingSelection, setPendingSelection] = useState<number | null>(null);

  useEffect(() => {
    onEntriesChange(entries);
  }, [entries, onEntriesChange]);

  const formatPhoneNumber = (phone: string) => {
    return phone.replace(/\D/g, '');
  };

  const validateInputs = () => {
    const newErrors = {
      phone: !newEntry.phone,
      id: !newEntry.id,
      apiKey: !newEntry.apiKey,
    };
    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error);
  };

  const saveToEnvFile = async (entry: typeof entries[0]) => {
    try {
      const envContent = `NEXT_PUBLIC_ALIGO_API_KEY=${entry.apiKey}
NEXT_PUBLIC_ALIGO_USER_ID=${entry.id}
NEXT_PUBLIC_ALIGO_SENDER=${formatPhoneNumber(entry.phone)}`;

      const response = await fetch('/api/save-env', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: envContent }),
      });

      if (!response.ok) {
        throw new Error('환경 변수 저장 실패');
      }

      toast({
        title: "환경 변수 저장 완료",
        description: "환경 변수가 성공적으로 저장되었습니다.",
      });
    } catch (error) {
      toast({
        title: "환경 변수 저장 실패",
        description: "환경 변수 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleAddEntry = () => {
    if (!validateInputs()) {
      toast({
        title: "필수 입력 항목 누락",
        description: "필수 내용을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    const formattedPhone = formatPhoneNumber(newEntry.phone);
    const newEntries = [...entries, { ...newEntry, phone: formattedPhone }];
    setEntries(newEntries);
    setNewEntry({ phone: '', name: '', id: '', apiKey: '' });
    setErrors({ phone: false, id: false, apiKey: false });
    setIsAdding(false);

    // 환경 변수 파일에 저장
    saveToEnvFile(newEntries[newEntries.length - 1]);
  };

  const handleDelete = (index: number) => {
    if (selectedIndex === index) {
      setSelectedIndex(null);
    }
    const newEntries = entries.filter((_, i) => i !== index);
    setEntries(newEntries);
    toast({
      title: "삭제 완료",
      description: "발신번호가 삭제되었습니다.",
    });
  };

  const handleSelectDefault = async (index: number) => {
    setPendingSelection(index);
    setShowConfirmDialog(true);
  };

  const confirmSelection = async () => {
    if (pendingSelection === null) return;

    setSelectedIndex(pendingSelection);
    const selectedEntry = entries[pendingSelection];
    await saveToEnvFile(selectedEntry);
    onSelect(selectedEntry.phone);
    
    toast({
      title: "대표번호 설정 완료",
      description: `${selectedEntry.name}(${selectedEntry.phone})이(가) 대표번호로 설정되었습니다.`,
    });

    setShowConfirmDialog(false);
    setPendingSelection(null);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent className="max-w-7xl h-[50vh]">
          <DialogHeader>
            <DialogTitle>발신번호 관리</DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" onClick={handleClose} className="absolute right-4 top-4">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </DialogHeader>
          <div className="p-4">
            <p className="text-sm mb-2">- 문자 발송 전 "발신번호 등록"을 하셔야 서비스 이용이 가능합니다.</p>
            <p className="text-sm mb-4">- 발신번호 등록 가능 개수: 10개</p>
            <div className="mb-4">
              <span>등록된 번호: {entries.length}/10개</span>
            </div>
            <table className="w-full border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2">대표번호 설정</th>
                  <th className="border p-2">휴대폰</th>
                  <th className="border p-2">발신번호명</th>
                  <th className="border p-2">USER_ID</th>
                  <th className="border p-2">API_key</th>
                  <th className="border p-2">삭제</th>
                </tr>
              </thead>
              <tbody>
                {isAdding && (
                  <tr>
                    <td className="border p-2 text-center"><input type="radio" name="대표번호" /></td>
                    <td className="border p-2">
                      <div className="flex flex-col">
                        <Input
                          type="text"
                          placeholder="휴대폰 번호"
                          value={newEntry.phone}
                          onChange={(e) => setNewEntry({ ...newEntry, phone: e.target.value })}
                          className={errors.phone ? "border-red-500" : ""}
                        />
                        {errors.phone && <span className="text-red-500 text-sm mt-1">필수 내용을 입력해주세요</span>}
                      </div>
                    </td>
                    <td className="border p-2">
                      <Input
                        type="text"
                        placeholder="발신번호명"
                        value={newEntry.name}
                        onChange={(e) => setNewEntry({ ...newEntry, name: e.target.value })}
                      />
                    </td>
                    <td className="border p-2">
                      <div className="flex flex-col">
                        <Input
                          type="text"
                          placeholder="ID"
                          value={newEntry.id}
                          onChange={(e) => setNewEntry({ ...newEntry, id: e.target.value })}
                          className={errors.id ? "border-red-500" : ""}
                        />
                        {errors.id && <span className="text-red-500 text-sm mt-1">필수 내용을 입력해주세요</span>}
                      </div>
                    </td>
                    <td className="border p-2">
                      <div className="flex flex-col">
                        <Input
                          type="text"
                          placeholder="API key"
                          value={newEntry.apiKey}
                          onChange={(e) => setNewEntry({ ...newEntry, apiKey: e.target.value })}
                          className={errors.apiKey ? "border-red-500" : ""}
                        />
                        {errors.apiKey && <span className="text-red-500 text-sm mt-1">필수 내용을 입력해주세요</span>}
                      </div>
                    </td>
                    <td className="border p-2"></td>
                  </tr>
                )}
                {entries.map((entry, index) => (
                  <tr key={index} onClick={() => handleSelectDefault(index)} className={selectedIndex === index ? 'bg-gray-200' : ''}>
                    <td className="border p-2 text-center">
                      <input 
                        type="radio" 
                        name="대표번호" 
                        checked={selectedIndex === index} 
                        onChange={() => handleSelectDefault(index)} 
                      />
                    </td>
                    <td className="border p-2">{entry.phone}</td>
                    <td className="border p-2">{entry.name}</td>
                    <td className="border p-2">{entry.id}</td>
                    <td className="border p-2">{entry.apiKey}</td>
                    <td className="border p-2 text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(index);
                        }}
                        className="hover:bg-red-100 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4">
              <Button variant="outline" className="w-full" onClick={isAdding ? handleAddEntry : () => setIsAdding(true)}>
                {isAdding ? '입력 확인' : '+ 신규 발신번호 등록'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 대표번호 설정 확인 대화상자 */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>대표번호 설정 확인</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {pendingSelection !== null && (
              <p>
                {entries[pendingSelection].name}({entries[pendingSelection].phone})을(를) 대표번호로 설정하시겠습니까?
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              취소
            </Button>
            <Button onClick={confirmSelection}>
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 