import React, { useState } from 'react';
import { Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Button } from '@/components/ui/input';

const AddressBookTab: React.FC = () => {
  const [contactList, setContactList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [groups, setGroups] = useState([]);

  const handleSendSelected = async () => {
    const selectedItems = contactList.filter(item => item.checked);
    if (selectedItems.length === 0) {
      alert('선택된 항목이 없습니다.');
      return;
    }

    const senderList = selectedItems.map(item => ({
      Conversation: item.Name,
      Phone_Number: item.Phone_Number,
      Check: true,
      message_fix: '',
      file_type_fix: '',
      files_fix: []
    }));

    try {
      const response = await fetch('/api/save-sender-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(senderList),
      });

      if (response.ok) {
        alert('발송 항목이 저장되었습니다.');
        window.location.href = '/message-sender';
      } else {
        alert('발송 항목 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error saving sender list:', error);
      alert('발송 항목 저장 중 오류가 발생했습니다.');
    }
  };

  const handleSendAll = async () => {
    const senderList = contactList.map(item => ({
      Conversation: item.Name,
      Phone_Number: item.Phone_Number,
      Check: true,
      message_fix: '',
      file_type_fix: '',
      files_fix: []
    }));

    try {
      const response = await fetch('/api/save-sender-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(senderList),
      });

      if (response.ok) {
        alert('발송 항목이 저장되었습니다.');
        window.location.href = '/message-sender';
      } else {
        alert('발송 항목 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error saving sender list:', error);
      alert('발송 항목 저장 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Input
            type="text"
            placeholder="검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Select value={selectedGroup} onValueChange={setSelectedGroup}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="그룹 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleSendSelected} variant="outline">
            발송항목전송
          </Button>
          <Button onClick={handleSendAll} variant="outline" className="bg-green-500 text-white hover:bg-green-600">
            친구추가전송
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddressBookTab; 